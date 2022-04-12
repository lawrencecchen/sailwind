import createDebounce from "@solid-primitives/debounce";
import {
  Accessor,
  Component,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { invariant } from "./invariant";

interface IRecentlyCopiedContext {
  recentlyCopied: Accessor<boolean>;
  copy: (s: string) => void;
}
const RecentlyCopiedContext = createContext<IRecentlyCopiedContext>();

export const RecentlyCopiedProvider: Component = (props) => {
  const [recentlyCopied, setRecentlyCopied] = createSignal(false);
  const setRecentlyCopiedDebounced = createDebounce(setRecentlyCopied, 3000);

  function copy(s: string) {
    navigator.clipboard.writeText(s);
    setRecentlyCopiedDebounced.clear();
    setRecentlyCopied(true);
    setRecentlyCopiedDebounced(false);
  }
  const value = {
    recentlyCopied,
    copy,
  };
  return (
    <RecentlyCopiedContext.Provider value={value}>
      {props.children}
    </RecentlyCopiedContext.Provider>
  );
};

export function useRecentlyCopied() {
  const context = useContext(RecentlyCopiedContext);
  invariant(
    context,
    "useRecentlyCopied must be used within a RecentlyCopiedProvider"
  );
  return context;
}
