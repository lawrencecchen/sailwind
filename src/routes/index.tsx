import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Show } from "solid-js";
import { isServer } from "solid-js/web";
import "uno.css";
import { Header } from "~/components/Header";
import { SyncProvider } from "~/components/Repl/Sync";
import { DEFAULT_CODE_2 } from "~/components/Repl/Codemirror";
import { ControlsProvider } from "~/components/Repl/Controls";
import { Repl } from "~/components/Repl/Repl";
import { generateId } from "~/lib/generateId";

export const routeData: RouteDataFunc = () => {
  return generateId();
};

export default function Home() {
  const replId = useRouteData<string>();

  return (
    <>
      <div class="flex flex-col h-full">
        <SyncProvider docId={replId} defaultValue={DEFAULT_CODE_2}>
          <ControlsProvider>
            <Header replId={replId} />
            <Repl />
            {/* {() => {
                const { isRightPanelOpen } = useControls();
                return (
                  <Show when={isRightPanelOpen()}>
                    <SidePanel />
                  </Show>
                );
              }} */}
          </ControlsProvider>
        </SyncProvider>
      </div>
    </>
  );
}
