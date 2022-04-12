import { Component, createEffect, createSignal, onMount, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { Scripts } from "solid-start/root";
import { getDomPath } from "~/lib/utils/getDomPath";

const HoveredElement: Component<{ boundingClientRect: DOMRect }> = (props) => {
  return (
    <div
      class="bg-blue-900 opacity-10 ring ring-inset"
      style={{
        transform: `translate(${props.boundingClientRect.left}px, ${props.boundingClientRect.top}px)`,
        width: `${props.boundingClientRect.width}px`,
        height: `${props.boundingClientRect.height}px`,
      }}
    ></div>
  );
};

const Srcdoc = () => {
  const [inspectModeEnabled, setInspectModeEnabled] = createSignal(false);
  const [hoveredElement, setHoveredElement] = createSignal<HTMLElement>();
  const [
    hoveredElementBoundingClientRect,
    setHoveredElementBoundingClientRect,
  ] = createSignal<DOMRect>();
  const [selectedElement, setSelectedElement] = createSignal<{
    ref: HTMLElement;
    path: string[];
  }>();

  onMount(() => {
    let scriptEls = [];
    let styleEls = [];
    let origin;

    async function handleMessage(e) {
      const { action } = e.data;
      origin = e.origin;
      // console.log(e);
      if (action === "eval") {
        if (scriptEls.length) {
          scriptEls.forEach((el) => {
            document.head.removeChild(el);
          });
          scriptEls.length = 0;
        }

        if (styleEls.length) {
          styleEls.forEach((el) => {
            document.head.removeChild(el);
          });
          styleEls.length = 0;
        }

        try {
          const { scripts, styles } = e.data;

          for (const script of scripts) {
            const scriptEl = document.createElement("script");
            scriptEl.setAttribute("type", "module");
            document.head.appendChild(scriptEl);
            scriptEl.innerHTML = script;
            // scriptEl.innerHTML = script + `\nwindow.__next__()`
            // scriptEl.onrror = err => send_error(err.message, err.stack)
            scriptEls.push(scriptEl);
          }

          for (const style of styles) {
            const styleEl = document.createElement("style");
            document.head.appendChild(styleEl);
            styleEl.innerHTML = style;
            styleEls.push(styleEl);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    document.body.addEventListener("click", (e: MouseEvent) => {
      if (e.which !== 1) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.defaultPrevented) return;
      // ensure target is a link
      let el = e.target as HTMLAnchorElement;
      while (el && el.nodeName !== "A") el = el.parentNode as HTMLAnchorElement;
      if (!el || el.nodeName !== "A") return;

      if (
        el.hasAttribute("download") ||
        el.getAttribute("rel") === "external" ||
        el.target
      )
        return;

      e.preventDefault();

      if (el.href.startsWith(origin)) {
        const url = new URL(el.href);
        if (url.hash[0] === "#") {
          window.location.hash = url.hash;
          return;
        }
      }

      window.open(el.href, "_blank");
    });

    window.addEventListener("mousemove", (e) => {
      if (!inspectModeEnabled()) return;
      if (hoveredElement() !== e.target) {
        const el = e.target as HTMLElement;
        setHoveredElement(el);
        setHoveredElementBoundingClientRect(el.getBoundingClientRect());
      }
    });

    document.body.addEventListener("mouseleave", (e) => {
      setHoveredElement(null);
      setHoveredElementBoundingClientRect(null);
    });

    window.addEventListener("click", (e) => {
      if (!inspectModeEnabled()) return;
      const ref = e.target as HTMLElement;
      const path = getDomPath(ref);
      console.log(path);
      setSelectedElement({
        ref,
        path,
      });
      // setInspectModeEnabled(false);
      setHoveredElement(null);
      setHoveredElementBoundingClientRect(null);
    });

    window.addEventListener("message", handleMessage, false);
  });

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@unocss/reset@0.31.0/tailwind.css"
        />
        {/* <link
          rel="stylesheet"
          href="https://cdn.skypack.dev/@tailwindcss/forms@0.4.0/dist/forms.min.css"
        /> */}
      </head>
      <body>
        <div id="root"></div>
        <Show when={inspectModeEnabled()}>
          <Portal>
            <div className="absolute inset-0 w-screen h-screen z-10 pointer-events-none">
              <Show when={hoveredElementBoundingClientRect()}>
                <HoveredElement
                  boundingClientRect={hoveredElementBoundingClientRect()}
                />
                {/* <div class="ring" style={{transform: `translate(${hoveredElement().})`}}></div> */}
              </Show>
            </div>
          </Portal>
        </Show>
        <Scripts />
      </body>
    </html>
  );
};
export default Srcdoc;
