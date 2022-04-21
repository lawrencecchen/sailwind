import { Component, createEffect, createMemo, createSignal } from "solid-js";
import { drag } from "~/lib/directives/drag";
drag;

export type Orientation = "horizontal" | "vertical";

const ValueDragger: Component<{
  orientation?: Orientation;
  onInput?: (d: { dx: number; dy: number }) => void;
}> = (props) => {
  return (
    <div
      use:drag={{
        onDrag: (e, initialEvent) => {
          props.onInput?.({
            dx: initialEvent.clientX - e.clientX,
            dy: initialEvent.clientY - e.clientY,
          });
        },
      }}
      class="absolute inset-0"
      classList={{
        "cursor-ew-resize": props.orientation === "horizontal",
        "cursor-ns-resize": props.orientation === "vertical",
      }}
    ></div>
  );
};

const SpacingInput: Component<{
  direction: "left" | "top" | "right" | "bottom";
  value: number;
  displayValue?: number;
  onInput?: (v: number | string) => void;
}> = (props) => {
  const orientation: Orientation =
    props.direction === "left" || props.direction === "right"
      ? "horizontal"
      : "vertical";
  let initialValue;

  return (
    <div
      class="grid place-items-center absolute inset-0 transform"
      classList={{
        "w-4 right-auto -translate-x-1/2": props.direction === "left",
        "h-4 bottom-auto -translate-y-1/2": props.direction === "top",
        "w-4 left-auto translate-x-1/2": props.direction === "right",
        "h-4 top-auto translate-y-1/2": props.direction === "bottom",
      }}
    >
      {/* <ValueDragger
        orientation={orientation}
        onInput={({ dx, dy }) =>
          props.onInput?.(orientation === "horizontal" ? dx : dy)
        }
      /> */}
      <div
        use:drag={{
          onDragStart: () => {
            initialValue = props.value;
          },
          onDrag: (e, initialEvent) => {
            if (orientation === "horizontal") {
              props.onInput?.(initialValue + initialEvent.clientX - e.clientX);
            } else {
              props.onInput?.(initialValue + initialEvent.clientY - e.clientY);
            }
          },
          cursorStyle: orientation === "horizontal" ? "ew-resize" : "ns-resize",
        }}
        class="absolute inset-0"
        classList={{
          "cursor-ew-resize": orientation === "horizontal",
          "cursor-ns-resize": orientation === "vertical",
        }}
      ></div>
      <div class="h-4 w-4 grid place-items-center bg-white transform">
        {/* <input type="checkbox" class="rounded-sm border-gray-400 w-3 h-3" /> */}
        <input
          type="text"
          class="rounded-sm border-gray-400 w-5 h-3.5 border text-xs text-center text-gray-800 tabular-nums"
          value={props.displayValue ?? props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
      </div>
    </div>
  );
};

interface SpacingUpdate {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

const SpacingControl: Component<{
  label: string;
  class?: string;
  onInput?: (props: SpacingUpdate) => void;
}> = (props) => {
  const [spacing, setSpacing] = createSignal({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  const displaySpacing = createMemo(() => {
    return Object.fromEntries(
      Object.entries(spacing()).map(([k, v]) => [k, Math.floor(v / 20)])
    );
  });
  createEffect(() => {
    props.onInput?.(displaySpacing());
  });
  return (
    <div
      className="items-center w-full grid grid-cols-4 gap-x-12"
      classList={{ [props.class]: !!props.class }}
    >
      <div className="col-span-1 text-xs font-medium text-gray-500 text-right">
        {props.label}
      </div>
      <div className="col-span-3 h-14 border border-gray-300 rounded-lg relative">
        <div className="absolute inset-0 p-3 grid place-content-center">
          <div className="text-xs text-gray-600">auto</div>
        </div>
        {/* <NumberInput
          className="absolute inset-0 p-3"
          onChange={() => {}}
          value={0}
          label={label[0]}
        /> */}
        <SpacingInput
          value={spacing().left}
          displayValue={displaySpacing().left}
          direction="left"
          onInput={(v) => {
            setSpacing((s) => ({
              ...s,
              left: Number(v),
            }));
            console.log(spacing());
          }}
        />
        <SpacingInput
          value={spacing().top}
          displayValue={displaySpacing().top}
          direction="top"
          onInput={(v) => {
            setSpacing((s) => ({
              ...s,
              top: Number(v),
            }));
          }}
        />
        <SpacingInput
          value={spacing().right}
          displayValue={displaySpacing().right}
          direction="right"
          onInput={(v) => {
            setSpacing((s) => ({
              ...s,
              right: Number(v),
            }));
          }}
        />
        <SpacingInput
          value={spacing().bottom}
          displayValue={displaySpacing().bottom}
          direction="bottom"
          onInput={(v) => {
            setSpacing((s) => ({
              ...s,
              bottom: Number(v),
            }));
          }}
        />
      </div>
    </div>
  );
};

export default SpacingControl;
