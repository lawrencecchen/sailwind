import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
} from "solid-js";
import { AcornJSXElement } from "./acorn/jsx";
import { useControls } from "./Controls";

const fontWeights = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
];

function listFonts() {
  let { fonts } = document;
  const it = fonts.entries();

  let arr = [];
  let done = false;

  while (!done) {
    const font = it.next();
    if (!font.done) {
      arr.push(font.value[0].family);
    } else {
      done = font.done;
    }
  }

  // converted to set then arr to filter repetitive values
  return [...new Set(arr)];
}

const Panel: Component<{ title: string }> = (props) => {
  return (
    <div class="flex flex-col border-t">
      <div className="text-xs font-semibold text-gray-900 px-4 py-2">
        {props.title}
      </div>
      <div className="px-4 py-2">{props.children}</div>
    </div>
  );
};

export const SidePanel = (props) => {
  const { setIsInspecting, isInspecting, selectedNode } = useControls();
  const [fontWeight, setFontWeight] = createSignal("normal");
  const selectedClasses = createMemo(() => {
    if (!selectedNode()) {
      return null;
    }
    const classes = findClassNameNode(selectedNode())?.value ?? "";
    const classesSet = new Set<string>();
    for (const className of classes.split(" ")) {
      classesSet.add(className);
    }
    const result = {
      classes,
      classesSet,
    };
    console.log(result);
    return result;
  });

  createEffect(() => {
    if (selectedNode()) {
      console.log(selectedNode().openingElement);
    }
  });

  function findClassNameNode(node: AcornJSXElement) {
    for (const attribute of node.openingElement.attributes) {
      if (attribute.name.name === "className") {
        return attribute.value;
      }
    }
  }

  return (
    <div class="w-[240px] max-w-[240px] min-w-[240px] border-l flex flex-col shrink-0">
      <div className="flex p-1 space-x-2 items-center">
        <button
          class="flex items-center p-1 cursor-default hover:ring-1 hover:ring-gray-200  hover:ring-offset-1 rounded-[0.5px]"
          aria-label="Inspect element"
          onClick={() => setIsInspecting(!isInspecting())}
          classList={{
            "text-gray-700 bg-gray-100": isInspecting(),
            "text-gray-500 active:bg-gray-100 active:text-gray-700":
              !isInspecting(),
          }}
        >
          <span class="i-carbon:inspection w-5 h-5" />
        </button>

        <button class="text-gray-900 font-semibold cursor-default text-xs">
          Design
        </button>
      </div>
      <div>
        <Show
          when={selectedNode()}
          fallback={
            <div class="text-xs text-gray-600 p-2">Select an element.</div>
          }
        >
          <div class="text-xs text-gray-600 p-2">
            {selectedClasses().classes}
          </div>
        </Show>
      </div>
      <Panel title="Text">
        {/* <select
          value={fontWeight()}
          onInput={(e) => setFontWeight(e.currentTarget.value)}
          class="text-xs border rounded-px"
          aria-label="Font family"
        >
          <For each={listFonts()}>
            {(name) => <option value={`${name}`}>{name}</option>}
          </For>
        </select> */}
        <select
          value={fontWeight()}
          onInput={(e) => setFontWeight(e.currentTarget.value)}
          class="text-xs border rounded-px"
          aria-label="Font weight"
        >
          <For each={fontWeights}>
            {(name) => <option value={`${name}`}>{name}</option>}
          </For>
        </select>
      </Panel>
    </div>
  );
};
