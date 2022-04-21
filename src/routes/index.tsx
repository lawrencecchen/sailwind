import { RouteDataFunc, useRouteData } from "solid-app-router";
import "uno.css";
import { Header } from "~/components/Header";
import {
  CodeMirrorProvider,
  DEFAULT_CODE_2,
} from "~/components/Repl/Codemirror";
import { ControlsProvider } from "~/components/Repl/Controls";
import { Repl } from "~/components/Repl/Repl";
import { SyncProvider } from "~/components/Repl/Sync";
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
            <CodeMirrorProvider>
              <Header replId={replId} />
              <Repl />
            </CodeMirrorProvider>
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
