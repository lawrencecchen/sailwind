import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Header } from "~/components/Header";
import { DEFAULT_CODE, Repl } from "~/components/Repl/Repl";

export const routeData: RouteDataFunc = ({ params }) => {
  return params.replId;
};

export default function ReplRoute() {
  const replId = useRouteData<string>();

  return (
    <div class="flex flex-col h-full">
      <Header replId={replId} showId={true} />
      <Repl
        replId={replId}
        defaultValue={DEFAULT_CODE}
        enableWebsocketProvider={true}
      />
    </div>
  );
}
