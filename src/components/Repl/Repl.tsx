import { basicSetup, EditorView } from "@codemirror/basic-setup";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { keymap, ViewUpdate } from "@codemirror/view";
import { Component, Show } from "solid-js";
import { yCollab } from "y-codemirror.next";
import { findJSXElement } from "./acorn";
import { CodeMirror, customTheme } from "./Codemirror";
import { useControls } from "./Controls";
import { Preview } from "./Preview";
import { SidePanel } from "./SidePanel";
import { useSync } from "./Sync";

export const Repl: Component = () => {
  const {
    yText,
    undoManager,
    wsProvider,
    outputCss,
    outputJavascript,
    errors,
    ast,
  } = useSync();

  const { showRightPanel, showCode, setSelectedNode } = useControls();

  function handleViewUpdate(v: ViewUpdate) {
    if (!v.selectionSet) {
      return;
    }
    const position = v.state.selection.ranges?.[0].from;
    if (ast()) {
      const selectedNode = findJSXElement(ast(), position);
      setSelectedNode(selectedNode);
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
        errors={errors()}
      />

      <Show when={showRightPanel()}>
        <SidePanel />
      </Show>
    </div>
  );
};
