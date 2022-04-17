import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Setter,
  useContext,
} from "solid-js";
import { invariant } from "~/lib/utils/invariant";

export const ControlsContext = createContext<{
  iframeRef: Accessor<HTMLIFrameElement>;
  setIframeRef: Setter<HTMLIFrameElement>;
  iframeLoaded: Accessor<boolean>;
  setIframeLoaded: Setter<boolean>;
  isInspecting: Accessor<boolean>;
  setIsInspecting: Setter<boolean>;
  showRightPanel: Accessor<boolean>;
  setShowRightPanel: Setter<boolean>;
  showCode: Accessor<boolean>;
  setShowCode: Setter<boolean>;
}>();

export const ControlsProvider: Component = (props) => {
  const [iframeRef, setIframeRef] = createSignal<HTMLIFrameElement>();
  const [iframeLoaded, setIframeLoaded] = createSignal(false);
  const [isInspecting, setIsInspecting] = createSignal(false);
  const [showRightPanel, setShowRightPanel] = createSignal(true);
  const [showCode, setShowCode] = createSignal(true);

  return (
    <ControlsContext.Provider
      value={{
        iframeRef,
        setIframeRef,
        iframeLoaded,
        setIframeLoaded,
        isInspecting,
        setIsInspecting,
        showRightPanel,
        setShowRightPanel,
        showCode,
        setShowCode,
      }}
    >
      {props.children}
    </ControlsContext.Provider>
  );
};

export function useControls() {
  const context = useContext(ControlsContext);
  invariant(context, "usePreviewContext must be used within a PreviewProvider");
  function evalScripts(script: string | string[]) {
    const iframe = context.iframeRef();
    if (iframe) {
      const scripts = Array.isArray(script) ? script : [script];
      iframe.contentWindow.postMessage(
        { action: "eval", scripts, styles: [] },
        "*"
      );
    }
  }
  function evalStyles(style: string | string[]) {
    const iframe = context.iframeRef();
    if (iframe) {
      const styles = Array.isArray(style) ? style : [style];
      iframe.contentWindow.postMessage(
        { action: "eval", scripts: [], styles },
        "*"
      );
    }
  }
  createEffect(() => {
    const iframe = context.iframeRef();
    if (context.isInspecting()) {
      iframe.contentWindow.postMessage({ action: "meta.enableInspectMode" });
    } else {
      iframe.contentWindow.postMessage({ action: "meta.disableInspectMode" });
    }
  });
  function messageHandler(e: MessageEvent) {
    const { action } = e.data;
    console.log(action);
    if (action === "meta.disableInspectMode") {
      context.setIsInspecting(false);
    }
  }
  onMount(() => {
    window.addEventListener("message", messageHandler, false);
  });
  onCleanup(() => {
    window.removeEventListener("message", messageHandler);
  });
  return {
    ...context,
    evalScripts,
    evalStyles,
  };
}
