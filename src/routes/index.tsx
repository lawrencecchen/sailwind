import { RouteDataFunc, useRouteData } from "solid-app-router";
import "uno.css";
import { Header } from "~/components/Header";
import { DEFAULT_CODE_2, Repl } from "~/components/Repl/Repl";
import { generateId } from "~/lib/generateId";

export const routeData: RouteDataFunc = () => {
  return generateId();
};

export default function Home() {
  const replId = useRouteData<string>();

  return (
    <>
      <div class="flex flex-col h-full">
        <Header replId={replId} />
        <Repl replId={replId} defaultValue={DEFAULT_CODE_2} />
      </div>
    </>
  );
}
