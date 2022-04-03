// @refresh reload
import { useLocation } from "solid-app-router";
import { Links, Meta, Routes, Scripts } from "solid-start/root";
import Srcdoc from "./components/Repl/Srcdoc";
import "./index.css";
import { RecentlyCopiedProvider } from "./lib/utils/useRecentlyCopied";

export default function Root() {
  const location = useLocation();
  if (location.pathname === "/impl/srcdoc") {
    return <Srcdoc />;
  }
  // if (location.pathname === "/foober/srcdoc") {
  //   return <Srcdoc />;
  // }

  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
          rel="stylesheet"
          href="//cdn.jsdelivr.net/npm/hack-font@3/build/web/hack-subset.css"
        />
      </head>
      <body class="antialiased h-full overflow-hidden">
        <RecentlyCopiedProvider>
          <Routes />
        </RecentlyCopiedProvider>
        <Scripts />
      </body>
    </html>
  );
}
