import { Link } from "solid-app-router";
import { Component, Show } from "solid-js";
import { useRecentlyCopied } from "~/lib/utils/useRecentlyCopied";
import { useControls } from "./Repl/Controls";

export const Header: Component<{ replId: string; showId?: boolean }> = (
  props
) => {
  const { recentlyCopied, copy } = useRecentlyCopied();
  const {
    setIsInspecting,
    isInspecting,
    showRightPanel,
    setShowRightPanel,
    showCode,
    setShowCode,
  } = useControls();
  return (
    <div class="px-2 py-1 border-b grid grid-cols-2 shrink-0">
      <div className="flex items-center">
        <Link href="/" class="font-bold">
          Sailwind
        </Link>
        <p class="ml-4 text-xs">A super fast Tailwind repl.</p>
        <a
          href="https://github.com/lawrencecchen/sailwind"
          rel="noopener noreferrer"
          target="_blank"
          class="flex items-center ml-2"
          aria-label="View on GitHub"
        >
          <span class="i-mdi-github w-5 h-5"></span>
        </a>
      </div>
      <div className="ml-auto mr-0 space-x-2 flex">
        <Link
          href={"/" + props.replId}
          class="ml-2 text-sm group flex items-center h-7"
          onClick={(e) => {
            copy(window.location.origin + "/" + props.replId);
          }}
        >
          <span
            class="flex items-center bg-gray-50 border rounded-l px-2 h-full font-medium transition"
            classList={{
              "text-blue-600 bg-blue-100": recentlyCopied(),
              "text-gray-700 group-hover:bg-gray-100 group-hover:text-gray-800":
                !recentlyCopied(),
              "rounded-r": !props.showId,
            }}
          >
            <Show
              when={recentlyCopied()}
              fallback={
                <span class="flex items-center">
                  Share{" "}
                  <span class="i-ic-round-share bg-gray-500 w-3.5 h-3.5 ml-1 group-hover:bg-gray-700 transition" />
                </span>
              }
            >
              Copied!
            </Show>
          </span>
          <Show when={props.showId}>
            <span class="flex items-center font-hack text-xs px-2 h-full border rounded-r text-gray-600 group-hover:text-gray-900 transition">
              {props.replId}
            </span>
          </Show>
        </Link>
        <button
          class="flex items-center p-1"
          aria-label="Toggle show code"
          onClick={() => setShowCode(!showCode())}
          classList={{
            "text-blue-500": showCode(),
            "text-gray-500": !showCode(),
          }}
        >
          <span className="i-carbon-code w-5 h-5"></span>
        </button>
        <button
          class="flex items-center p-1"
          aria-label="Toggle right sidebar"
          onClick={() => setShowRightPanel(!showRightPanel())}
          classList={{
            "text-blue-500": showRightPanel(),
            "text-gray-500": !showRightPanel(),
          }}
        >
          <span className="i-carbon-open-panel-filled-right w-5 h-5"></span>
        </button>
      </div>
    </div>
  );
};
