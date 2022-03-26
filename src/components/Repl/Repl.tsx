import { basicSetup, EditorState, EditorView } from "@codemirror/basic-setup";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";
import {
  Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { isServer } from "solid-js/web";
import { transform } from "sucrase";
import { yCollab } from "y-codemirror.next";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { drag } from "~/lib/directives/drag";
import { wrap } from "~/lib/utils/wrap";
drag;

const customTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "Hack, monospace",
    fontSize: "12px",
  },
});

const CodeMirror: Component<{
  onInput?: (text: string) => void;
  docName: string;
  extensions?: Extension[];
}> = (props) => {
  let divRef: HTMLDivElement;

  onMount(async () => {
    let docName = props.docName;

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

export const DEFAULT_CODE = `import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";

function App() {
  return <h1>Hello World</h1>
}

ReactDOM.render(<App />, document.getElementById("root"));
`;

export const Repl: Component<{
  replId: string;
  defaultValue?: string;
  enableWebsocketProvider?: boolean;
}> = (props) => {
  if (isServer) {
    return;
  }
  let iframeRef: HTMLIFrameElement;
  let previewRef: HTMLDivElement;
  const uno = createGenerator({ presets: [presetUno()] });
  const ydoc = new Y.Doc();
  const indexeddbProvider = new IndexeddbPersistence(props.replId, ydoc);
  // const wsUrl = `ws://${window.location.host}/ws`;
  // https://sailwind.lawrencecchen.repl.co/
  const wsUrl = `wss://sailwind.lawrencecchen.repl.co`;
  const wsProvider = new WebsocketProvider(wsUrl, props.replId, ydoc, {
    connect: props.enableWebsocketProvider,
  });
  const yText = ydoc.getText("codemirror");
  yText.observe(() => {
    setCode(yText.toJSON());
  });

  wsProvider.once("synced", () => {
    console.log("Synced!", yText.toJSON());
    ydoc.transact(() => {
      if (props.defaultValue && yText.length === 0) {
        yText.insert(0, props.defaultValue);
      }
    });
  });

  const undoManager = new Y.UndoManager(yText, {
    // Add all origins that you want to track. The editor binding adds itself automatically.
    trackedOrigins: new Set([]),
  });

  const [previewWidth, setPreviewWidth] = createSignal();
  const [code, setCode] = createSignal(null);
  const [error, setError] = createSignal(false);
  const [iframeLoaded, setIframeLoaded] = createSignal(false);
  const outputJavascript = createMemo(() => {
    if (!code()) {
      return "";
    }
    try {
      setError(false);
      const compiled = transform(code(), {
        transforms: ["typescript", "jsx"],
      });
      return compiled.code;
    } catch (error) {
      setError(error);
      console.log(error);
      return error.message;
    }
  });
  const [outputCss] = createResource(code, async (code) => {
    if (!code) {
      return "";
    }
    try {
      setError(false);
      const styles = await uno.generate(code);
      return styles.css;
    } catch (error) {
      setError(error);
      console.log(error);
      return "An error.";
    }
  });

  onMount(() => {
    iframeRef.addEventListener("load", () => {
      setIframeLoaded(true);
    });
  });

  onCleanup(() => {
    wsProvider.destroy();
  });

  createEffect(() => {
    if (iframeLoaded() && !error()) {
      const scripts = [outputJavascript()];
      const styles = [outputCss()];
      iframeRef.contentWindow.postMessage({ action: "eval", scripts, styles });
    }
  });

  return (
    <div class="flex h-full">
      <div class="grow overflow-hidden">
        <CodeMirror
          extensions={[
            basicSetup,
            keymap.of([indentWithTab]),
            javascript({ jsx: true, typescript: true }),
            yCollab(yText, wsProvider.awareness, { undoManager }),
            customTheme,
          ]}
          docName="hello-world"
        />
        <details class="p-2" open>
          <summary>output</summary>
          <Show when={outputJavascript()}>
            <p class="font-bold">javascript</p>
            <pre class="text-xs whitespace-pre-wrap font-hack">
              {outputJavascript()}
            </pre>
          </Show>
          <Show when={outputCss()}>
            <p class="font-bold">css</p>
            <pre class="text-xs whitespace-pre-wrap font-hack">
              {outputCss()}
            </pre>
          </Show>
        </details>
      </div>
      <div
        style={{
          width: previewWidth() ? previewWidth() + "px" : "50%",
          "min-width": "320px",
          "max-width": "calc(100% - 50px)",
        }}
        class="shrink-0 h-full relative"
        ref={previewRef}
      >
        <div
          className="absolute -left-1 h-full w-2  cursor-ew-resize"
          use:drag={{
            onDrag: (e, initialEvent, previewWidth) => {
              if (!previewWidth) {
                previewWidth = previewRef.clientWidth;
              }
              const offset = initialEvent.clientX - e.clientX;
              setPreviewWidth(wrap(8, Infinity, previewWidth + offset));
              return previewWidth;
            },
            cursorStyle: "ew-resize",
          }}
        ></div>
        <Show when={!error()}>
          <iframe
            ref={iframeRef}
            src="/srcdoc.html"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            class="h-full w-full border-l"
          ></iframe>
        </Show>
      </div>
    </div>
  );
};
