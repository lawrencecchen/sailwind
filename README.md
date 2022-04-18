# Sailwind

A very fast Tailwind + React Repl. Inspired by the [Vue SFC repl](https://github.com/vuejs/repl), the [Svelte Repl](https://github.com/sveltejs/sites/tree/master/packages/repl), [unocss](https://github.com/unocss/unocss) and [motif.land](motif.land).

## personal reference

- https://github.dev/vuejs/repl

swc transpile

```ts
function useSWC() {
  const [swcInitialized, setSwcInitialized] = createSignal(false);
  const [swc, setSwc] = createSignal<typeof swcType>();

  onMount(async () => {
    const swc = await import("@swc/wasm-web");
    const initSwc = swc.default;
    await initSwc();
    setSwc(swc);
    setSwcInitialized(true);
    console.log("Initialized swc!");
  });

  return { swc, swcInitialized };
}

const compiled = swc().transformSync(code(), {
  jsc: {
    parser: {
      syntax: "typescript",
      tsx: true,
      module: true,
    },
  },
});

// SWC parser

const result = swc().parseSync(code(), {
  syntax: "typescript",
  tsx: true,
  isModule: true,
});
return result;

//   Acorn parser

return parser.parse(code(), {
  sourceType: "module",
  ecmaVersion: 2022,
});

// Esbuild parser

return parse(code(), {
  sourceType: "module",
  plugins: ["jsx", "typescript"],
});
```

throttled memo ast

```ts
const ast =
  !isServer &&
  createThrottledMemo(() => {
    if (!code()) {
      return null;
    }
    try {
      return parser.parse(code(), {
        sourceType: "module",
        ecmaVersion: 2022,
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }, 20);
```
