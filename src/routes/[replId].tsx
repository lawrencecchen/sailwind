import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Header } from "~/components/Header";
import { Repl } from "~/components/Repl/Repl";

export const routeData: RouteDataFunc = ({ params }) => {
  return params.replId;
};

export default function ReplRoute() {
  const replId = useRouteData<string>();

  return (
    <div class="flex flex-col h-full">
      <Header replId={replId} showId={true} />
      <Repl replId={replId} enableWebsocketProvider={true} />
    </div>
  );
}
