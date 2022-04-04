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

  return (
    <html lang="en" class="h-full">
      <head>
        <title>Sailwind</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A super fast Tailwind/React repl." />
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
