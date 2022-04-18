import { createGenerator } from "@unocss/core";
import { presetUno } from "@unocss/preset-uno";
import {
  Accessor,
  Component,
  createContext,
  createMemo,
  createResource,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  Resource,
  splitProps,
  useContext,
} from "solid-js";
import { isServer } from "solid-js/web";
import { transform } from "sucrase";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { invariant } from "~/lib/utils/invariant";
import { parser } from "./acorn";

interface SyncProviderProps {
  ydoc?: Y.Doc;
  docId: string;
  enableWebsocketProvider?: boolean;
  defaultValue?: string;
}

interface SyncContext extends Partial<SyncProviderProps> {
  ydoc: Y.Doc;
  yText: Y.Text;
  indexeddbProvider?: IndexeddbPersistence;
  wsProvider?: WebsocketProvider;
  undoManager?: Y.UndoManager;
  code: Accessor<string>;
  outputJavascript: Accessor<string>;
  outputCss: Resource<string>;
  errors: Accessor<CompileErrors>;
  ast: Accessor<acorn.Node>;
}

type CompileErrors = {
  type: "script" | "style";
  message?: string;
  fileName?: string;
}[];

export const SyncContext = createContext<SyncContext>();

function getIndexeddbProvider(
  docId: string,
  ydoc: Y.Doc,
  yText: Y.Text,
  defaultValue?: string
) {
  if (isServer) {
    return undefined;
  }
  const indexeddbProvider = new IndexeddbPersistence(docId, ydoc);
  onMount(() => {
    indexeddbProvider.once("synced", () => {
      console.log("Synced IndexedDB!");
      if (defaultValue && yText.length === 0) {
        console.log("Init code");
        yText.insert(0, defaultValue);
      }
    });
  });
  onCleanup(() => {
    indexeddbProvider.destroy();
  });
  return indexeddbProvider;
}

function getWebsocketProvider(
  wsUrl: string,
  docId: string,
  ydoc: Y.Doc,
  enableWebsocketProvider: boolean
) {
  if (isServer) {
    return undefined;
  }
  if (location.protocol === "https:") {
    wsUrl = wsUrl.replace("ws://", "wss://");
  }
  const wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
    connect: enableWebsocketProvider,
  });
  onMount(() => {
    wsProvider.once("synced", () => {
      console.log("Synced Websocket!");
    });
  });
  onCleanup(() => {
    wsProvider.destroy();
  });
  return wsProvider;
}

function getUndoManager(yText: Y.Text) {
  const undoManager = new Y.UndoManager(yText, {
    // Add all origins that you want to track. The editor binding adds itself automatically.
    trackedOrigins: new Set([]),
  });
  return undoManager;
}

export const SyncProvider: Component<SyncProviderProps> = (props) => {
  props = mergeProps(
    { enableWebsocketProvider: false, defaultValue: "" },
    props
  );
  const [local, rest] = splitProps(props, [
    "ydoc",
    "docId",
    "enableWebsocketProvider",
    "defaultValue",
  ]);
  const [errors, setErrors] = createSignal<CompileErrors>([]);
  const [code, setCode] = createSignal(null);
  const ydoc = local.ydoc ?? new Y.Doc();
  const yText = ydoc.getText("codemirror");

  onMount(() => {
    yText.observe(() => {
      setCode(yText.toJSON());
    });
  });

  const outputJavascript = createMemo(() => {
    if (!code()) {
      return "";
    }
    try {
      setErrors((e) => e.filter((e) => e.type !== "script"));
      const compiled = transform(code(), {
        transforms: ["typescript", "jsx"],
      });
      return compiled.code;
    } catch (error) {
      setErrors((e) => [...e, { type: "script", message: error.message }]);
      console.log(error);
      return error.message;
    }
  });
  const uno = createGenerator({ presets: [presetUno()] });

  const [outputCss] = createResource(code, async (code) => {
    if (!code) {
      return "";
    }
    try {
      setErrors((e) => e.filter((e) => e.type !== "style"));
      const styles = await uno.generate(code);
      return styles.css;
    } catch (error) {
      setErrors((e) => [...e, { type: "style", message: error.message }]);
      console.log(error);
      return "An error.";
    }
  });
  const ast = createMemo(() => {
    if (!code()) {
      return null;
    }
    try {
      return parser.parse(code(), {
        sourceType: "module",
        ecmaVersion: 2022,
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  });
  const indexeddbProvider = getIndexeddbProvider(
    local.docId,
    ydoc,
    yText,
    local.defaultValue
  );
  const wsProvider = getWebsocketProvider(
    // @ts-ignore
    import.meta.env.VITE_WEBSOCKET_URL as string,
    local.docId,
    ydoc,
    local.enableWebsocketProvider
  );
  const undoManager = getUndoManager(yText);

  const value: SyncContext = {
    ...local,
    ydoc,
    yText,
    indexeddbProvider,
    wsProvider,
    undoManager,
    code,
    outputJavascript,
    outputCss,
    errors,
    ast,
  };
  return (
    <SyncContext.Provider value={value}>{rest.children}</SyncContext.Provider>
  );
};

export function useSync() {
  const context = useContext(SyncContext);
  invariant(context, "useCode must be used within a SyncProvider");
  return context;
}
