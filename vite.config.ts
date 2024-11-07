import { defineConfig } from "vite";
import yaml from "@rollup/plugin-yaml";
import hmrify from "vite-plugin-hmrify";
import arraybuffer from "vite-plugin-arraybuffer";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [yaml(), hmrify(), arraybuffer(), wasm()],
  resolve: {
    alias: {
      "~": "/src",
    },
  },
});
