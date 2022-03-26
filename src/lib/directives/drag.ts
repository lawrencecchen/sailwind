import { onCleanup } from "solid-js";

export function drag(el, accessor) {
  let initialEvent;
  let immutableContainer: any;
  let overlay: HTMLDivElement;

  function mousemove(e) {
    const result = accessor?.()?.onDrag?.(e, initialEvent, immutableContainer);
    if (!immutableContainer) {
      immutableContainer = result;
    }
  }

  function mousedown(e) {
    initialEvent = e;
    overlay = document.createElement("div");
    overlay.setAttribute(
      "style",
      "position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;"
    );
    document.body.appendChild(overlay);
    document.body.style.userSelect = "none";
    document.body.style.cursor = accessor?.().cursorStyle ?? "ew-resize";
    accessor?.()?.onDragStart?.(e);
    window.addEventListener("mousemove", mousemove);
  }

  function reset(e) {
    initialEvent = null;
    immutableContainer = null;
    document.body.style.userSelect = "auto";
    document.body.style.cursor = "auto";
    if (overlay) {
      document.body.removeChild(overlay);
    }
    accessor?.()?.onDragEnd?.(e);
  }

  function mouseup(e) {
    reset(e);
    window.removeEventListener("mousemove", mousemove);
  }

  function mouseleave(e) {
    reset(e);
    window.removeEventListener("mousemove", mousemove);
  }

  el.addEventListener("mousedown", mousedown);
  window.addEventListener("mouseup", mouseup);
  window.addEventListener("mouseleave", mouseleave);

  onCleanup(() => {
    el.removeEventListener("mousedown", mousedown);
    window.removeEventListener("mouseup", mouseup);
    window.removeEventListener("mousemove", mousemove);
    window.removeEventListener("mouseleave", mouseleave);
  });
}
