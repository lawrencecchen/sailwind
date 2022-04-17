import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Show } from "solid-js";
import { isServer } from "solid-js/web";
import * as Y from "yjs";
import { Header } from "~/components/Header";
import { ControlsProvider } from "~/components/Repl/Controls";
import { Repl } from "~/components/Repl/Repl";
import { YjsProvider } from "~/components/Repl/Yjs";

export const routeData: RouteDataFunc = ({ params }) => {
  return params.replId;
};

export default function ReplRoute() {
  const replId = useRouteData<string>();
  const ydoc = new Y.Doc();

  return (
    <div class="flex flex-col h-full">
      <Show when={!isServer && ydoc}>
        <YjsProvider ydoc={ydoc}>
          <ControlsProvider>
            <Header replId={replId} showId={true} />
            <Repl replId={replId} enableWebsocketProvider={true} />
          </ControlsProvider>
        </YjsProvider>
      </Show>
    </div>
  );
}
