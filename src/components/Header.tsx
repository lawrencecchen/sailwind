import { Link } from "solid-app-router";
import { Component, Show } from "solid-js";
import { useRecentlyCopied } from "~/lib/utils/useRecentlyCopied";

export const Header: Component<{ replId: string; showId?: boolean }> = (
  props
) => {
  const { recentlyCopied, copy } = useRecentlyCopied();
  return (
    <div class="px-2 py-1 border-b grid grid-cols-3 shrink-0">
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
      <div class="flex items-center justify-center">
        <button class="flex items-center" aria-label="Inspect element">
          <span class="i-carbon:inspection w-5 h-5 text-gray-800" />
        </button>
      </div>
      <div className="ml-auto mr-0">
        <Link
          href={"/" + props.replId}
          class="ml-2 text-sm group flex items-center h-7"
          onClick={(e) => {
            copy(window.location.origin + "/" + props.replId);
          }}
        >
          <span
            class="flex items-center bg-gray-50 border border-r-0 rounded-l px-2 h-full font-medium transition"
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
      </div>
    </div>
  );
};
