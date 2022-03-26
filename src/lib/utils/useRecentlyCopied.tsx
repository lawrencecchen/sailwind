import {
  Accessor,
  Component,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

interface IRecentlyCopiedContext {
  recentlyCopied: Accessor<boolean>;
  copy: (s: string) => void;
}
const RecentlyCopiedContext = createContext<IRecentlyCopiedContext>();

export const RecentlyCopiedProvider: Component = (props) => {
  const [recentlyCopied, setRecentlyCopied] = createSignal(false);
  let timeout: any;
  function copy(s: string) {
    setRecentlyCopied(true);
    navigator.clipboard.writeText(s);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setRecentlyCopied(false);
    }, 3000);
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
  if (!context) {
    throw new Error(
      "useRecentlyCopied must be used within a RecentlyCopiedProvider"
    );
  }
  return context;
}
