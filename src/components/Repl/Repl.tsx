import { EditorSelection } from "@codemirror/state";
import { ViewUpdate } from "@codemirror/view";
import { Component, createEffect, createSignal, onMount, Show } from "solid-js";
import { findJSXElement, findJSXElementFromPath } from "./acorn";
import { CodeMirror, useCodeMirror } from "./Codemirror";
import { useControls } from "./Controls";
import { Preview } from "./Preview";
import { SidePanel } from "./SidePanel";
import { useSync } from "./Sync";

export const Repl: Component = () => {
  const { yText, outputCss, outputJavascript, errors, ast } = useSync();
  const [position, setPosition] = createSignal<number>();

  const { showRightPanel, showCode, setSelectedNode, inspectedElementPath } =
    useControls();

  function updateSelectedNode(position: number) {
    if (ast()) {
      const selectedNode = findJSXElement(ast(), position);
      setSelectedNode(selectedNode);
    }
  }

  createEffect(() => {
    if (inspectedElementPath().length && ast()) {
      const appPath = inspectedElementPath().slice(1);
      const selectedNode = findJSXElementFromPath(ast(), appPath);
      setSelectedNode(selectedNode);
      if (selectedNode) {
        editorView().dispatch({
          selection: EditorSelection.range(
            selectedNode.openingElement.start,
            selectedNode.openingElement.end
          ),
        });
      }
    }
  });

  onMount(() => {
    yText.observe((e, transaction) => {
      updateSelectedNode(position());
    });
  });
  const { editorView } = useCodeMirror({
    updateListener: handleViewUpdate,
  });

  function handleViewUpdate(v: ViewUpdate) {
    if (!v.selectionSet) {
      return;
    }
    const position = v.state.selection.ranges?.[0].from;
    console.log(position);
    setPosition(position);
    updateSelectedNode(position);
  }

  return (
    <div class="flex grow min-h-0">
      <div class="grow overflow-hidden" classList={{ hidden: !showCode() }}>
        <CodeMirror />
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
