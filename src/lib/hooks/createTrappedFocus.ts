import { onCleanup, onMount } from "solid-js";

const focusableElements =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function createTrappedFocus(ref: Element, cleanup?: () => void) {
  function keydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      return cleanup();
    }
    const isTabPressed = e.key === "Tab";

    if (!isTabPressed) {
      return;
    }

    const firstFocusableChild = ref.querySelectorAll(
      focusableElements
    )[0] as HTMLElement;
    const focusableChildren = ref.querySelectorAll(focusableElements);
    const lastFocusableChild = focusableChildren[
      focusableChildren.length - 1
    ] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusableChild) {
        e.preventDefault();
        lastFocusableChild && lastFocusableChild.focus();
        return;
      }
    } else {
      if (document.activeElement === lastFocusableChild) {
        e.preventDefault();
        firstFocusableChild && firstFocusableChild.focus();
      }
    }
  }

  function focus(e: FocusEvent) {
    if (e.currentTarget === window) {
      e.preventDefault();
      const firstFocusableChild = ref.querySelectorAll(
        focusableElements
      )[0] as HTMLElement;
      firstFocusableChild && firstFocusableChild.focus();
      return;
    }
  }

  onMount(() => {
    const firstFocusableChild = ref?.querySelectorAll(
      focusableElements
    )[0] as HTMLElement;
    firstFocusableChild?.focus();

    document.addEventListener("keydown", keydown);
    document.addEventListener("focus", focus);
  });
  onCleanup(() => {
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("focus", focus);
  });
}
