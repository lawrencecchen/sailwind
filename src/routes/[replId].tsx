import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Header } from "~/components/Header";
import { ControlsProvider } from "~/components/Repl/Controls";
import { Repl } from "~/components/Repl/Repl";
import { SyncProvider } from "~/components/Repl/Sync";

export const routeData: RouteDataFunc = ({ params }) => {
  return params.replId;
};

export default function ReplRoute() {
  const replId = useRouteData<string>();

  return (
    <div class="flex flex-col h-full">
      <SyncProvider docId={replId} enableWebsocketProvider={true}>
        <ControlsProvider>
          <Header replId={replId} showId={true} />
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
  );
}
