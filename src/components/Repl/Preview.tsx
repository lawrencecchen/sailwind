import { createDebounce } from "@solid-primitives/debounce";
import { Component, createEffect, createSignal, Show } from "solid-js";
import { Transition } from "solid-transition-group";
import { drag } from "~/lib/directives/drag";
import { wrap } from "~/lib/utils/wrap";
import { useControls } from "./Controls";
drag;

export const Preview: Component<{
  scripts: string | string[];
  styles: string | string[];
  errors: any[];
}> = (props) => {
  const [previewWidth, setPreviewWidth] = createSignal<number>(500);
  const [resizing, setResizing] = createSignal(false);
  const {
    setIframeRef,
    iframeLoaded,
    setIframeLoaded,
    evalScripts,
    evalStyles,
    showRightPanel,
  } = useControls();
  const { showCode } = useControls();

  let previewRef: HTMLDivElement;
  const setResizingDebounce = createDebounce(setResizing, 1000);
  createEffect(() => {
    if (iframeLoaded() && props.errors.length === 0) {
      if (props.scripts) {
        evalScripts(props.scripts);
      }
      if (props.styles) {
        evalStyles(props.styles);
      }
    }
  });
  function getWidth(
    previewWidth: number,
    showCode: boolean,
    showRightPanel: boolean
  ) {
    if (showRightPanel) {
      return `min(calc(100% - 241px - 50px), ${previewWidth}px)`;
    }
    if (!showCode) {
      return "auto";
    }
    if (previewWidth) {
      return previewWidth + "px";
    }
    return "50%";
  }
  return (
    <>
      <div
        style={{
          //   width: showCode()
          //     ? previewWidth()
          //       ? previewWidth() + "px"
          //       : "50%"
          //     : "auto",
          //   width: previewWidth() ? previewWidth() + "px" : "auto",
          width: getWidth(previewWidth(), showCode(), showRightPanel()),
          "min-width": "320px",
          "max-width": showCode() ? "calc(100% - 50px)" : "100%",
        }}
        class="shrink-0 h-full relative grow"
        ref={previewRef}
      >
        <Transition
          exitClass="opacity-100"
          exitToClass="opacity-0"
          exitActiveClass="duration-200 transition"
        >
          <Show when={resizing()}>
            <div class="absolute top-2 right-2 bg-white border shadow-md rounded-2xl px-2 py-1 text-xs font-hack text-gray-600">
              {previewWidth()}
            </div>
          </Show>
        </Transition>
        <div
          class="absolute -left-1 h-full w-2  cursor-ew-resize"
          use:drag={{
            onDragStart: () => {
              setResizingDebounce.clear();
              setResizing(true);
            },
            onDrag: (e, initialEvent, stuff) => {
              if (!stuff) {
                stuff = {
                  initialWidth: previewRef.clientWidth,
                };
              }
              const { initialWidth } = stuff;
              const offset = initialEvent.clientX - e.clientX;
              setPreviewWidth(wrap(320, Infinity, initialWidth + offset));
              return {
                initialWidth,
              };
            },
            onDragEnd: () => {
              setResizingDebounce.clear();
              setResizingDebounce(false);
            },
            cursorStyle: "ew-resize",
          }}
        ></div>
        <Show
          when={props.errors.length === 0}
          fallback={<p>An error occurred</p>}
        >
          <iframe
            ref={setIframeRef}
            src="/impl/srcdoc"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            class="h-full w-full border-l"
            onLoad={() => setIframeLoaded(true)}
          ></iframe>
          <Transition
            exitClass="opacity-100"
            exitToClass="opacity-0"
            exitActiveClass="duration-200 transition"
          >
            <Show when={!iframeLoaded()}>
              <div class="absolute left-1/2 right-1/2 top-1/2 transform -translate-y-1/2">
                <div
                  aria-label="Loading..."
                  class="i-gg-spinner w-8 h-8 animate-spin bg-gray-500"
                />
              </div>
            </Show>
          </Transition>
        </Show>
      </div>
    </>
  );
};
