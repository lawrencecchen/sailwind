import { createSignal, onMount } from "solid-js";
import * as swcType from "@swc/wasm-web";
import { DEFAULT_CODE_2 } from "~/components/Repl/Codemirror";

const Swc = () => {
  const [initialized, setInitialized] = createSignal(false);
  const [code, setCode] = createSignal(DEFAULT_CODE_2);
  let swc: typeof swcType;

  onMount(async () => {
    swc = await import("@swc/wasm-web");
    const initSwc = swc.default;

    await initSwc();
    setInitialized(true);
    console.log("Initialized swc!");
  });

  function compile(code: string) {
    if (!initialized()) {
      return;
    }
    const result = swc.transformSync(code, {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
        },
      },
    });
    console.log(result);
  }

  return (
    <div>
      <textarea
        onInput={(e) => setCode(e.currentTarget.value)}
        rows={20}
        cols={40}
        value={code()}
      ></textarea>
      <button onClick={() => compile(code())}>compile</button>
    </div>
  );
};
export default Swc;
