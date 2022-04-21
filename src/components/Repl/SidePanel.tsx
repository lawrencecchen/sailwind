import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  JSX,
  Setter,
} from "solid-js";
import { Component, createMemo, For, Show } from "solid-js";
import { Rule } from "unocss";
import { AcornJSXElement } from "./acorn/jsx";
import { useControls } from "./Controls";
import SpacingControl from "./Design/SpacingControl";
import { useSync } from "./Sync";
import { presetUno } from "@unocss/preset-uno";
import { useCodeMirror } from "./Codemirror";
import { EditorSelection } from "@codemirror/state";
// import {rules} from '@unocss/preset-min'

const fontWeightsMap = {
  Thin: "font-thin",
  "Extra Light": "font-extralight",
  Light: "font-light",
  Regular: "font-normal",
  Medium: "font-medium",
  "Semi Bold": "font-semibold",
  Bold: "font-bold",
  "Extra Bold": "font-extrabold",
  Black: "font-black",
};
const fontWeightsValues = Object.values(fontWeightsMap);

const textAlignsMap = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
  justify: "text-justify",
};
const textAlignValues = Object.values(textAlignsMap);

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

const Panel: Component<{ title: string; class?: string }> = (props) => {
  return (
    <div
      class="flex flex-col border-t"
      classList={{ [props.class]: !!props.class }}
    >
      <div className="text-xs font-semibold text-gray-900 px-4 py-3">
        {props.title}
      </div>
      <div className="px-4 py-1 flex flex-col">{props.children}</div>
    </div>
  );
};

interface SelectedClasses {
  classes: string;
  classesSet: Set<string>;
}

type DropdownMenuValue = string | number | string[];

export function DropdownMenu<T>(props: {
  options: T[];
  children: (option: T) => JSX.Element;
  value: DropdownMenuValue;
  defaultValue?: DropdownMenuValue;
  onInput: (value: DropdownMenuValue) => void;
}) {
  const [value, setValue] = createSignal<DropdownMenuValue>(
    props.value ?? props.defaultValue
  );
  createEffect(() => {
    setValue(props.value as any);
  });

  function input(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    setValue(target.value);
    props.onInput(target.value);
  }

  return (
    <>
      <div class="border rounded-px text-xs inline p-1.5">{value()}</div>
      <select value={value()} onInput={input}>
        <For each={props.options}>{(o) => props.children(o)}</For>
      </select>
    </>
  );
}

export const DropdownOption: Component<{ value: string }> = (props) => {
  return <option value={props.value}>{props.children}</option>;
};
interface ToggleGroupChildrenProps {
  value: string;
  label: string;
  id: string;
  selected: boolean;
  setSelected: (v: string) => void;
}
type ToggleGroupOption = {
  value: string;
  label: string;
  children: (options: ToggleGroupChildrenProps) => JSX.Element;
};
type ToggleGroupOptions = ToggleGroupOption[];

export const ToggleGroup: Component<{
  options: ToggleGroupOptions;
  name?: string;
  value?: string;
  defaultValue?: string;
  onInput?: (value: string) => void;
  class?: string;
}> = (props) => {
  const [selected, setSelected] = createSignal(props.defaultValue);
  const id = `__toggle_group_` + createUniqueId();
  createEffect(() => {
    setSelected(props.value);
  });
  function set(v: string) {
    setSelected(v);
    props?.onInput(selected());
  }
  return (
    <>
      <div classList={{ [props.class]: !!props.class }}>
        <For each={props.options}>
          {({ value, label, children }) => (
            <>
              {children({
                value,
                label,
                id,
                selected: selected() === value,
                setSelected: set,
              })}
              <input
                hidden
                type="radio"
                name={props.name ?? id}
                id={id}
                value={value}
                aria-label={label}
                checked={selected() === value}
              />
            </>
          )}
        </For>
      </div>
    </>
  );
};

export const SidePanel = () => {
  const { editorView } = useCodeMirror();

  const { setIsInspecting, isInspecting, selectedNode } = useControls();
  const { yText, ydoc } = useSync();
  const selectedClasses = createMemo<SelectedClasses>(() => {
    if (!selectedNode()) {
      return null;
    }
    const classes = getClassNameValue(selectedNode())?.value ?? "";
    const classesSet = new Set<string>();
    for (const className of classes.split(" ")) {
      if (className) {
        classesSet.add(className);
      }
    }
    const result = {
      classes,
      classesSet,
    };
    return result;
  });

  function createMemoAttribute(values: string[], fallback: string) {
    return createMemo(() => {
      if (!selectedClasses()) {
        return null;
      }
      const { classesSet } = selectedClasses();
      for (const value of values) {
        if (classesSet.has(value)) {
          return value;
        }
      }
      return fallback;
    });
  }
  // console.log(presetUno().rules);
  // function createMemoRule(rules: Rule[], fallback) {

  // }

  const fontWeight = createMemoAttribute(fontWeightsValues, "font-normal");
  const textAlign = createMemoAttribute(textAlignValues, "text-left");
  function directionSize(value: string) {
    return 0 as any;
  }
  const margins: Rule[] = [
    [/^ma?()-?(-?.+)$/, directionSize("margin")],
    [/^m-?xy()()$/, directionSize("margin")],
    [/^m-?([xy])(?:-?(-?.+))?$/, directionSize("margin")],
    [/^m-?([rltbse])(?:-?(-?.+))?$/, directionSize("margin")],
    [/^m-(block|inline)(?:-(-?.+))?$/, directionSize("margin")],
    [/^m-?([bi][se])(?:-?(-?.+))?$/, directionSize("margin")],
  ];

  const margin = createMemo(() => {
    if (!selectedClasses()) {
      return null;
    }
    const { classes } = selectedClasses();
    for (const [rule] of margins) {
      const match = (rule as any).exec(classes);
      if (match) {
        // const n = /(\d+)/.exec(match[0])[0];
        // return n;
        return match[0];
      }
    }
    return "m-0";
  });
  // createEffect(() => {
  //   console.log(margin());
  // });

  function setClassName(oldClassName: string, newClassName: string) {
    const hasExistingClassAttribute = selectedClasses().classesSet.size > 0;
    let absoluteStartIndex: number;

    if (hasExistingClassAttribute) {
      const classNameNode = findClassNameNode(selectedNode());
      const relativeStartIndex =
        selectedClasses().classes.indexOf(oldClassName);
      absoluteStartIndex = classNameNode.value.start + relativeStartIndex + 1;

      ydoc.transact(() => {
        if (selectedClasses().classesSet.has(oldClassName)) {
          yText.delete(absoluteStartIndex, oldClassName.length);
          yText.insert(absoluteStartIndex, newClassName);
        } else {
          absoluteStartIndex += 1;
          yText.insert(absoluteStartIndex, newClassName + " ");
        }
      });
    } else {
      const openingElement = selectedNode().openingElement;
      absoluteStartIndex = openingElement.name.end;
      yText.insert(absoluteStartIndex, ` className="${newClassName}"`);
      absoluteStartIndex = absoluteStartIndex + ` className="`.length;
      console.log("yes one");
    }
    // const highlightStart = selectedClasses().classes.indexOf(newClassName) + findClassNameNode
    editorView().dispatch({
      selection: EditorSelection.range(
        absoluteStartIndex,
        absoluteStartIndex + newClassName.length
      ),
    });
  }

  function findClassNameNode(node: AcornJSXElement) {
    for (const attribute of node.openingElement.attributes) {
      if (
        attribute.name.name === "className" ||
        attribute.name.name === "class"
      ) {
        return attribute;
      }
    }
    return null;
  }

  function getClassNameValue(node: AcornJSXElement) {
    return findClassNameNode(node)?.value;
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

      <Show when={selectedNode()}>
        <Panel title="Spacing">
          <div className="pb-4 space-y-6">
            <SpacingControl
              label="Margin"
              onInput={(s) => {
                // setClassName(margin(), `m-${s.left}`);
              }}
            />
            <SpacingControl label="Padding" />
          </div>
        </Panel>
        <Panel title="Text" class="flex flex-col">
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
          <div className="">
            <select
              value={fontWeight()}
              onInput={(e) => setClassName(fontWeight(), e.currentTarget.value)}
              class="text-xs border rounded-sm p-1.5"
              aria-label="Font weight"
            >
              <For each={Object.entries(fontWeightsMap)}>
                {([label, fontWeight]) => (
                  <option value={fontWeight}>{label}</option>
                )}
              </For>
            </select>
          </div>

          <div className="">
            <ToggleGroup
              defaultValue="text-left"
              class="inline-flex mt-2 hover:ring-gray-200 hover:ring-1 ring-inset rounded-[3px]"
              value={textAlign()}
              onInput={(v) => setClassName(textAlign(), v)}
              options={[
                {
                  value: "text-left",
                  label: "Align left",
                  children: ({ id, value, selected, setSelected }) => (
                    <button
                      class="flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm"
                      classList={{ "bg-gray-200 border-gray-200": selected }}
                      onMouseDown={() => setSelected(value)}
                      aria-labelledby={id}
                    >
                      <div class="i-radix-icons-text-align-left w-5 h-5" />
                    </button>
                  ),
                },
                {
                  value: "text-center",
                  label: "Align center",
                  children: ({ id, value, selected, setSelected }) => (
                    <button
                      class="flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm"
                      classList={{ "bg-gray-200 border-gray-200": selected }}
                      onMouseDown={() => setSelected(value)}
                      aria-labelledby={id}
                    >
                      <div class="i-radix-icons-text-align-center w-5 h-5" />
                    </button>
                  ),
                },
                {
                  value: "text-right",
                  label: "Align right",
                  children: ({ id, value, selected, setSelected }) => (
                    <button
                      class="flex p-0.5 cursor-default text-gray-700 border border-transparent rounded-sm"
                      classList={{ "bg-gray-200 border-gray-200": selected }}
                      onMouseDown={() => setSelected(value)}
                      aria-labelledby={id}
                    >
                      <div class="i-radix-icons-text-align-right w-5 h-5" />
                    </button>
                  ),
                },
              ]}
            />
          </div>

          {/* <DropdownMenu
            value={fontWeight()}
            onInput={(v) => setClassName(fontWeight(), String(v))}
            options={Object.entries(fontWeightsMap)}
            defaultValue="font-normal"
            aria-label="Font weight"
            >
            {([label, fontWeight]) => (
              <DropdownOption value={fontWeight}>{label}</DropdownOption>
            )}
          </DropdownMenu> */}
        </Panel>
      </Show>
      <div>
        <Show
          when={selectedClasses()}
          fallback={
            <div class="text-xs text-gray-600 p-2">Select an element.</div>
          }
        >
          <div class="text-xs text-gray-600 p-2">
            {selectedClasses().classes}
          </div>
        </Show>
      </div>
    </div>
  );
};
