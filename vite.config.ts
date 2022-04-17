import { defineConfig } from "vite";
import solid from "solid-start";
import Unocss from "unocss/vite";
import { presetIcons, presetUno } from "unocss";

export default defineConfig({
  plugins: [
    solid(),
    Unocss({
      presets: [
        presetIcons({
          extraProperties: {
            display: "inline-block",
          },
        }),
        presetUno(),
      ],
    }),
  ],
  resolve: {
    alias: {
      sucrase: "sucrase/dist/index.js",
    },
  },
  optimizeDeps: {
    exclude: ["@swc/wasm-web"],
  },
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:1234",
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/ws": {
        target: "ws://localhost:1234",
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
