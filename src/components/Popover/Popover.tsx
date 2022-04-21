import { ComputePositionConfig } from "@floating-ui/core";
import { computePosition } from "@floating-ui/dom";
import {
  Accessor,
  children,
  Component,
  createContext,
  createEffect,
  createSignal,
  createUniqueId,
  JSX,
  mergeProps,
  onMount,
  Setter,
  Show,
  useContext,
} from "solid-js";
import { Dynamic, Portal } from "solid-js/web";
import { createClickOutside } from "~/lib/hooks/createOnClickOutside";
import { createTrappedFocus } from "~/lib/hooks/createTrappedFocus";

interface PopoverContextInterface {
  id: string;
  isOpen: Accessor<boolean>;
  setIsOpen: Setter<boolean>;
  referenceElement: Accessor<HTMLElement | undefined>;
  setReferenceElement: Setter<HTMLElement | undefined>;
}

const PopoverContext = createContext<PopoverContextInterface>();

const Root: Component = (props) => {
  const id = createUniqueId();
  const [isOpen, setIsOpen] = createSignal(false);
  const [referenceElement, setReferenceElement] = createSignal<
    HTMLElement | undefined
  >();
  const store = {
    id,
    isOpen,
    setIsOpen,
    referenceElement,
    setReferenceElement,
  };

  return (
    <PopoverContext.Provider value={store}>
      {props.children}
    </PopoverContext.Provider>
  );
};

function usePopover() {
  const popoverContext = useContext(PopoverContext);
  if (!popoverContext) {
    throw new Error("Missing Popover.Root");
  }
  return popoverContext;
}

const Trigger: Component<{
  as?: Component | string | keyof JSX.IntrinsicElements;
  class?: string;
  classList?: string[];
  ref?: HTMLElement;
  "aria-label"?: string;
}> = (props) => {
  const merged = mergeProps({ as: "button" }, props);
  const { id, isOpen, setIsOpen, referenceElement, setReferenceElement } =
    usePopover();
  let triggerElement: HTMLElement | undefined = merged.ref;
  const c = children(() => props.children);

  onMount(() => {
    if (!referenceElement() && triggerElement) {
      setReferenceElement(triggerElement);
    }
  });

  return (
    <Dynamic
      component={merged.as}
      aria-label={merged["aria-label"]}
      aria-haspopup="dialog"
      aria-expanded={isOpen()}
      aria-controls={id}
      onClick={() => setIsOpen(!isOpen())}
      class={merged.class}
      ref={triggerElement}
      classList={merged.classList}
    >
      {c()}
    </Dynamic>
  );
};

interface CreateStylesInterface {
  x?: number;
  y?: number;
  strategy?: JSX.CSSProperties["position"];
}

function createStyles({
  x = 0,
  y = 0,
  strategy = "absolute",
}: CreateStylesInterface): JSX.CSSProperties {
  return {
    position: strategy,
    left: `${x}px`,
    top: `${y}px`,
  };
}

type ContentBodyRenderProp<T, U> = ({
  ariaProps,
  isOpen,
  setContentElement,
  style,
}: {
  ariaProps: JSX.HTMLAttributes<T>;
  isOpen: Accessor<boolean>;
  setContentElement: Setter<Element>;
  style: Accessor<JSX.CSSProperties>;
}) => U;

interface ContentBodyProps<T, U> {
  options?: Partial<ComputePositionConfig>;
  role?: JSX.HTMLAttributes<Element>["role"];
  children?: U | ContentBodyRenderProp<T, U>;
}

const ContentBody = <T, U extends JSX.Element>(
  props: ContentBodyProps<T, U>
) => {
  const merged = mergeProps({ role: "dialog" }, props);

  const { id, referenceElement, setIsOpen, isOpen } = usePopover();
  const [contentElement, setContentElement] = createSignal<Element>();
  const [style, setStyle] = createSignal<JSX.CSSProperties>();

  function close() {
    setIsOpen(false);
    referenceElement()?.focus();
  }

  createEffect(async () => {
    if (!isOpen()) {
      return;
    }

    const content = contentElement(),
      reference = referenceElement();

    if (!reference) {
      throw new Error("No reference element found");
    }
    if (!content) {
      throw new Error("No content element found");
    }
    createClickOutside([content, reference], close);
    createTrappedFocus(content, close);
    const { x, y, strategy } = await computePosition(
      reference,
      content as HTMLElement,
      merged.options
    );
    setStyle(createStyles({ x, y, strategy }));
  });

  const ariaProps: JSX.AttrAttributes = {
    id,
    role: "dialog",
  };
  const child = merged.children;

  if (typeof child === "function") {
    return (child as ContentBodyRenderProp<T, U>)({
      ariaProps,
      isOpen,
      setContentElement,
      style,
    });
  }
  return (
    <Show when={isOpen()}>
      <div
        {...ariaProps}
        ref={setContentElement}
        style={style()}
        class="relative"
      >
        {child}
      </div>
    </Show>
  );
};

const Content = <T, U extends JSX.Element>(props: ContentBodyProps<T, U>) => {
  return (
    <Portal>
      <ContentBody {...props} />
    </Portal>
  );
};

const Close: Component = (props) => {
  const { setIsOpen } = usePopover();
  return (
    <button
      aria-label="close"
      class="absolute top-1.5 right-1.5"
      onClick={() => setIsOpen(false)}
    >
      {props.children}
    </button>
  );
};

export { Content, Trigger, Root, Close };
