import { defineConfig } from "vite";
import solid from "solid-start";
import Unocss from "unocss/vite";
import { presetIcons } from "unocss";
import fs from "fs";

export default defineConfig({
  plugins: [
    solid(),
    Unocss({
      presets: [
        presetIcons({
          extraProperties: {
            display: "inline-block",
          },
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      sucrase: "sucrase/dist/index.js",
    },
  },
  server: {
    // https: {
    //   key: fs.readFileSync("./.cert/key.pem"),
    //   cert: fs.readFileSync("./.cert/cert.pem"),
    // },
    proxy: {
      "/ws": {
        target: "ws://localhost:1234",
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    },
  },
  preview: {
    // https: {
    //   key: fs.readFileSync("./.cert/key.pem"),
    //   cert: fs.readFileSync("./.cert/cert.pem"),
    // },
    proxy: {
      "/ws": {
        target: "ws://localhost:1234",
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
