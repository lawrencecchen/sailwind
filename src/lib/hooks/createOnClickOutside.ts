import { onCleanup, onMount } from "solid-js";

export function createClickOutside(
  ref: Element | Element[],
  handler: (e: MouseEvent | TouchEvent) => void
) {
  function listener(e: MouseEvent | TouchEvent) {
    if (Array.isArray(ref)) {
      const containsClick = ref
        .map((r) => !r || r.contains(e.target as Node))
        .some(Boolean);
      if (containsClick) {
        return;
      }
    } else if (!ref || ref.contains(e.target as Node)) {
      return;
    }
    handler(e);
  }
  onMount(() => {
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchend", listener);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", listener);
    document.removeEventListener("touchend", listener);
  });
}
