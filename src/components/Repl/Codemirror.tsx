import { EditorState, EditorView } from "@codemirror/basic-setup";
import { Extension } from "@codemirror/state";
import { Component, onCleanup, onMount } from "solid-js";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export const customTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "Hack, monospace",
    fontSize: "12px",
  },
});

export function useCodemirrorYText({
  docId,
  ydoc,
  enableWebsocketProvider,
  defaultValue,
  onChange,
}: {
  docId: string;
  ydoc: Y.Doc;
  enableWebsocketProvider: boolean;
  defaultValue: string;
  onChange: (yText: Y.Text) => void;
}) {
  let indexeddbProvider = new IndexeddbPersistence(docId, ydoc);
  indexeddbProvider.once("synced", () => {
    console.log("Synced IndexedDB!");
    if (defaultValue && yText.length === 0) {
      console.log("Init code");
      yText.insert(0, defaultValue);
    }
  });
  // @ts-ignore
  let wsUrl = import.meta.env.VITE_WEBSOCKET_URL as string;
  if (location.protocol === "https:") {
    wsUrl = wsUrl.replace("ws://", "wss://");
  }
  const wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: enableWebsocketProvider,
  });
  wsProvider.once("synced", () => {
    console.log("Synced Websocket!");
  });
  onCleanup(() => {
    wsProvider.destroy();
  });
  const yText = ydoc.getText("codemirror");
  yText.observe(() => {
    onChange(yText);
  });
  const undoManager = new Y.UndoManager(yText, {
    // Add all origins that you want to track. The editor binding adds itself automatically.
    trackedOrigins: new Set([]),
  });

  return {
    yText,
    undoManager,
    indexeddbProvider,
    wsProvider,
  };
}

export const CodeMirror: Component<{
  onInput?: (text: string) => void;
  extensions?: Extension[];
}> = (props) => {
  let divRef: HTMLDivElement;

  onMount(async () => {
    const state = EditorState.create({
      extensions: props.extensions,
    });

    const view = new EditorView({
      state,
      parent: divRef,
    });
  });
  return <div ref={divRef} class="h-full flex-grow" />;
};

export const DEFAULT_CODE_1 = `import React from "https://cdn.skypack.dev/react";
  import ReactDOM from "https://cdn.skypack.dev/react-dom";
  
  function App() {
    return <h1>Hello World</h1>
  }
  
  ReactDOM.render(<App />, document.getElementById("root"));
  `;

export const DEFAULT_CODE_2 = `import React from "https://cdn.skypack.dev/react";
  import ReactDOM from "https://cdn.skypack.dev/react-dom";
  
  function App() {
    return <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <img
        src="https://play.tailwindcss.com/img/beams.jpg"
        alt=""
        className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
        width={1308}
      />
      <div className="absolute inset-0 bg-[url(https://play.tailwindcss.com/img/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-medium">Sailwind</h1>
          <div className="divide-y divide-gray-300/50">
            <div className="space-y-6 pb-8 pt-4 text-base leading-7 text-gray-600">
              <p>
                A super fast playground for Tailwind CSS, built with Solid.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg
                    className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx={12} cy={12} r={11} />
                    <path
                      d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                      fill="none"
                    />
                  </svg>
                  <p className="ml-4">
                    Instant response. Start typing and see!
                  </p>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx={12} cy={12} r={11} />
                    <path
                      d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                      fill="none"
                    />
                  </svg>
                  <p className="ml-4">
                    Multiplayer (click share on the top right!)
                  </p>
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx={12} cy={12} r={11} />
                    <path
                      d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9"
                      fill="none"
                    />
                  </svg>
                  <p className="ml-4">Code completion with instant preview</p>
                </li>
              </ul>
              <p>
                Perfect for learning how the framework works, prototyping a new
                idea, or creating a demo to share online.
              </p>
            </div>
            <div className="pt-8 text-base font-semibold leading-7">
              <p className="text-gray-900">Check out some examples:</p>
              <p className="flex flex-col">
                <a
                  href="https://sailwind.dev/most-agreeable-hydrogen-4e1"
                  className="text-sky-500 hover:text-sky-600"
                >
                  Modal →
                </a>
                <a
                  href="https://sailwind.dev/better-aggressive-cartoon-8b8"
                  className="text-sky-500 hover:text-sky-600"
                >
                  Sign in page →
                </a>
                <a
                  href="https://sailwind.dev/brash-angry-nightfall-ac1"
                  className="text-sky-500 hover:text-sky-600"
                >
                  Hot toasts →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
  
  ReactDOM.render(<App />, document.getElementById("root"));`;
