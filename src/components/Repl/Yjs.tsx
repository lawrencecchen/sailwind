import { Component, createContext, useContext } from "solid-js";
import * as Y from "yjs";
import { invariant } from "~/lib/utils/invariant";

export const YjsContext = createContext<{ ydoc: Y.Doc }>();
export const YjsProvider: Component<{ ydoc: Y.Doc }> = (props) => {
  return (
    <YjsContext.Provider value={{ ydoc: props.ydoc }}>
      {props.children}
    </YjsContext.Provider>
  );
};

export function useYjs() {
  const context = useContext(YjsContext);
  invariant(context, "useYjs must be used within a YjsProvider");
  return context;
}
