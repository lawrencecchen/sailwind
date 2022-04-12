import {
  Component,
  createContext,
  createSignal,
  Signal,
  useContext,
} from "solid-js";
import { invariant } from "./invariant";

type SelectedTool = "inspector";

interface ISelectedTool {
  selectedTool: Signal<SelectedTool>;
}

const SelectedToolContext = createContext<ISelectedTool>();

export const SelectedToolProvider: Component = (props) => {
  const selectedTool = createSignal<SelectedTool>();

  return (
    <SelectedToolContext.Provider value={{ selectedTool }}>
      {props.children}
    </SelectedToolContext.Provider>
  );
};

export function useSelectedTool() {
  const context = useContext(SelectedToolContext);
  invariant(
    context,
    "useSelectedTool must be used within a SelectedToolProvider"
  );
  return context;
}
