import { defineConfig } from "vite";
import solid from "solid-start";
import Unocss from "unocss/vite";
import { presetIcons } from "unocss";

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
      ],
    }),
  ],
  resolve: {
    alias: {
      sucrase: "sucrase/dist/index.js",
    },
  },
});
