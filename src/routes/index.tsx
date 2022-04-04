import { RouteDataFunc, useRouteData } from "solid-app-router";
import { Header } from "~/components/Header";
import { DEFAULT_CODE, Repl } from "~/components/Repl/Repl";
import { generateId } from "~/lib/generateId";
import "uno.css";

export const routeData: RouteDataFunc = () => {
  return generateId();
};

export default function Home() {
  const replId = useRouteData<string>();

  return (
    <>
      <div class="flex flex-col h-full">
        <Header replId={replId} />
        <Repl replId={replId} defaultValue={DEFAULT_CODE} />
      </div>
    </>
  );
}
