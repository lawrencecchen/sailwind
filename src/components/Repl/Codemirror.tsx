import { basicSetup, EditorState, EditorView } from "@codemirror/basic-setup";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { Extension } from "@codemirror/state";
import { keymap, ViewUpdate } from "@codemirror/view";
import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  Setter,
  useContext,
} from "solid-js";
import invariant from "tiny-invariant";
import { yCollab } from "y-codemirror.next";
import { useSync } from "./Sync";

export const customTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "Hack, monospace",
    fontSize: "12px",
  },
});

interface CodemirrorContextProps {
  editorState: Accessor<EditorState>;
  setEditorState: Setter<EditorState>;
  editorView: Accessor<EditorView>;
  setEditorView: Setter<EditorView>;
  editorRef: Accessor<HTMLDivElement>;
  setEditorRef: Setter<HTMLDivElement>;
  updateListeners: UpdateListenerFn[];
}

const CodeMirrorContext = createContext<CodemirrorContextProps>();
type UpdateListenerFn = (update: ViewUpdate) => void;
export const CodeMirrorProvider: Component<{
  extensions?: Extension[];
}> = (props) => {
  props = mergeProps({ extensions: [] }, props);
  const { yText, undoManager, wsProvider } = useSync();
  const [editorState, setEditorState] = createSignal<EditorState>();
  const [editorView, setEditorView] = createSignal<EditorView>();
  const [editorRef, setEditorRef] = createSignal<HTMLDivElement>();
  const updateListeners = [];

  function handleUpdate(v: ViewUpdate) {
    for (const listener of updateListeners) {
      listener(v);
    }
  }

  onMount(() => {
    const state = EditorState.create({
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        javascript({ jsx: true, typescript: true }),
        yCollab(yText, wsProvider.awareness, { undoManager }),
        EditorView.updateListener.of(handleUpdate),
        EditorState.allowMultipleSelections.of(true),
        customTheme,
        ...props.extensions,
      ],
    });
    setEditorState(state);
  });
  createEffect(() => {
    if (editorRef() && editorState()) {
      const view = new EditorView({
        state: editorState(),
        parent: editorRef(),
      });
      setEditorView(view);
    }
  });
  return (
    <CodeMirrorContext.Provider
      value={{
        editorState,
        setEditorState,
        editorView,
        setEditorView,
        editorRef,
        setEditorRef,
        updateListeners,
      }}
    >
      {props.children}
    </CodeMirrorContext.Provider>
  );
};

export function useCodeMirror(props?: {
  updateListener?: (update: ViewUpdate) => void;
}) {
  const context = useContext(CodeMirrorContext);
  invariant(context, "useCodeMirror must be used within a CodeMirrorProvider");
  if (props?.updateListener) {
    context.updateListeners.push(props.updateListener);
    onCleanup(() => {
      context.updateListeners.splice(
        context.updateListeners.indexOf(props.updateListener),
        1
      );
    });
  }
  return context;
}

export const CodeMirror: Component = (props) => {
  const { setEditorRef } = useCodeMirror();
  return <div ref={setEditorRef} class="h-full flex-grow" />;
};

export const DEFAULT_CODE_1 = `import React from "https://cdn.skypack.dev/react";
import ReactDOM from "https://cdn.skypack.dev/react-dom";

function App() {
  return <h1>Hello World</h1>
}

ReactDOM.render(<App />, document.getElementById("root"));
`;

export const DEFAULT_CODE_2 = `import React from "react";
import ReactDOM from "react-dom";

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
