import { basicSetup, EditorView } from "@codemirror/basic-setup";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { keymap, ViewUpdate } from "@codemirror/view";
import { createThrottledMemo } from "@solid-primitives/memo";
import * as swcType from "@swc/wasm-web";
import { createGenerator } from "@unocss/core";
import presetUno from "@unocss/preset-uno";
import { Parser } from "acorn";
import jsx from "acorn-jsx";
import { extend } from "acorn-jsx-walk";
import * as walk from "acorn-walk";
import {
  Component,
  createMemo,
  createResource,
  createSignal,
  For,
  Show,
} from "solid-js";
import { transform } from "sucrase";
import { yCollab } from "y-codemirror.next";
import { CodeMirror, customTheme, useCodemirrorYText } from "./Codemirror";
import { useControls } from "./Controls";
import { Preview } from "./Preview";
import { useYjs } from "./Yjs";

function useSWC() {
  const [swcInitialized, setSwcInitialized] = createSignal(true);
  const [swc, setSwc] = createSignal<typeof swcType>();

  //   onMount(async () => {
  //     const swc = await import("@swc/wasm-web");
  //     const initSwc = swc.default;
  //     await initSwc();
  //     setSwc(swc);
  //     setSwcInitialized(true);
  //     console.log("Initialized swc!");
  //   });

  return { swc, swcInitialized };
}

const weightMap: Record<string, string> = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
  // int[0, 900] -> int
};
export const SidePanel = (props) => {
  console.log(Object.keys(weightMap));
  const [fontWeight, setFontWeight] = createSignal("normal");

  return (
    <div class="w-[240px] max-w-[240px] min-w-[240px] border-l flex flex-col shrink-0">
      noice
      <select
        value={fontWeight()}
        onInput={(e) => setFontWeight(e.currentTarget.value)}
      >
        <For each={Object.keys(weightMap)}>
          {(name) => <option value={`${name}`}>{name}</option>}
        </For>
      </select>
    </div>
  );
};

export const Repl: Component<{
  replId: string;
  defaultValue?: string;
  enableWebsocketProvider?: boolean;
}> = (props) => {
  const uno = createGenerator({ presets: [presetUno()] });
  const { ydoc } = useYjs();
  const { yText, undoManager, wsProvider } = useCodemirrorYText({
    docId: props.replId,
    ydoc,
    enableWebsocketProvider: props.enableWebsocketProvider,
    defaultValue: props.defaultValue,
    onChange: (yText) => {
      setCode(yText.toJSON());
    },
  });

  const [code, setCode] = createSignal(null);
  const [jsError, setJsError] = createSignal(false);
  const [cssError, setCssError] = createSignal(false);
  const { swc, swcInitialized } = useSWC();
  const { showRightPanel: isRightPanelOpen, showCode } = useControls();

  const outputJavascript = createMemo(() => {
    if (!code()) {
      return "";
    }
    if (!swcInitialized()) {
      return "";
    }
    try {
      setJsError(false);
      //   const compiled = swc().transformSync(code(), {
      //     jsc: {
      //       parser: {
      //         syntax: "typescript",
      //         tsx: true,
      //         module: true,
      //       },
      //     },
      //   });
      const compiled = transform(code(), {
        transforms: ["typescript", "jsx"],
      });
      return compiled.code;
    } catch (error) {
      setJsError(error);
      console.log(error);
      return error.message;
    }
  });
  const [outputCss] = createResource(code, async (code) => {
    if (!code) {
      return "";
    }
    try {
      setCssError(false);
      const styles = await uno.generate(code);
      return styles.css;
    } catch (error) {
      setCssError(error);
      console.log(error);
      return "An error.";
    }
  });

  const parser = Parser.extend(jsx());
  extend(walk.base);
  const ast = createThrottledMemo(() => {
    if (!code()) {
      return null;
    }
    if (!swcInitialized()) {
      return null;
    }
    try {
      //   const result = swc().parseSync(code(), {
      //     syntax: "typescript",
      //     tsx: true,
      //     isModule: true,
      //   });
      //   return result;
      return parser.parse(code(), {
        sourceType: "module",
        ecmaVersion: 2022,
      });
      // return parse(code(), {
      //   sourceType: "module",
      //   plugins: ["jsx", "typescript"],
      // });
    } catch (error) {
      console.log(error);
      return null;
    }
  }, 20);

  function handleViewUpdate(v: ViewUpdate) {
    if (!v.selectionSet) {
      return;
    }
    const position = v.state.selection.ranges?.[0].from;
    if (ast()) {
      console.log(ast());
      const selectedNode = walk.findNodeAround(ast(), position);
      console.log(selectedNode);
    }
  }

  return (
    <div class="flex grow min-h-0">
      <div class="grow overflow-hidden" classList={{ hidden: !showCode() }}>
        <CodeMirror
          extensions={[
            basicSetup,
            keymap.of([indentWithTab]),
            javascript({ jsx: true, typescript: true }),
            yCollab(yText, wsProvider.awareness, { undoManager }),
            EditorView.updateListener.of(handleViewUpdate),
            customTheme,
          ]}
        />
      </div>

      <Preview
        scripts={outputJavascript()}
        styles={outputCss()}
        error={jsError() || cssError()}
      />

      <Show when={isRightPanelOpen()}>
        <SidePanel />
      </Show>
    </div>
  );
};
