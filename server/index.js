#!/usr/bin/env node

/**
 * @type {any}
 */
const WebSocket = require("ws");
const http = require("http");
const wss = new WebSocket.Server({ noServer: true });
const utils = require("y-websocket/bin/utils.js");
const { RedisPersistence } = require("y-redis");
const setupWSConnection = utils.setupWSConnection;

const port = process.env.PORT || 8080;

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

const redisPersistence = new RedisPersistence({redisOpts: {
    host: process.env.REDISHOST || "localhost",
    port: process.env.REDISPORT || 6379,
    username: process.env.REDISUSER || "",
    password: process.env.REDISPASSWORD || "",
}});

/*
  Persistence must have the following signature:
 { bindState: function(string,WSSharedDoc):void, writeState:function(string,WSSharedDoc):Promise }
 */
utils.setPersistence({
  provider: redisPersistence,
  bindState: async (docName, ydoc) => {
    // Here you listen to granular document updates and store them in the database
    // You don't have to do this, but it ensures that you don't lose content when the server crashes
    // See https://github.com/yjs/yjs#Document-Updates for documentation on how to encode
    // document updates

    const persistedYdoc = redisPersistence.bindState(docName, ydoc);
    ydoc.on('update', persistedYdoc.updateHandler);

  },
  writeState: (docName, ydoc) => {
    // This is called when all connections to the document are closed.
    // In the future, this method might also be called in intervals or after a certain number of updates.
    return new Promise((resolve) => {
      // When the returned Promise resolves, the document will be destroyed.
      // So make sure that the document really has been written to the database.
      redisPersistence.closeDoc(docName)
      resolve();
    });
  },
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  // You may check auth of request here..
  /**
   * @param {any} ws
   */
  const handleAuth = (ws) => {
    wss.emit("connection", ws, request);
  };
  wss.handleUpgrade(request, socket, head, handleAuth);
});

server.listen(port);

console.log("running on port", port);
