import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Show } from "solid-js";
import { isServer } from "solid-js/web";
import "uno.css";
import * as Y from "yjs";
import { Header } from "~/components/Header";
import { DEFAULT_CODE_2 } from "~/components/Repl/Codemirror";
import { ControlsProvider } from "~/components/Repl/Controls";
import { Repl, SidePanel } from "~/components/Repl/Repl";
import { YjsProvider } from "~/components/Repl/Yjs";
import { generateId } from "~/lib/generateId";

export const routeData: RouteDataFunc = () => {
  return generateId();
};

export default function Home() {
  const replId = useRouteData<string>();
  const ydoc = new Y.Doc();

  return (
    <>
      <div class="flex flex-col h-full">
        <Show when={!isServer && ydoc}>
          <YjsProvider ydoc={ydoc}>
            <ControlsProvider>
              <Header replId={replId} />
              <Repl replId={replId} defaultValue={DEFAULT_CODE_2} />
              {/* {() => {
                const { isRightPanelOpen } = useControls();
                return (
                  <Show when={isRightPanelOpen()}>
                    <SidePanel />
                  </Show>
                );
              }} */}
            </ControlsProvider>
          </YjsProvider>
        </Show>
      </div>
    </>
  );
}
