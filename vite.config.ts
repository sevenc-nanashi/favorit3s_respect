import fs from "node:fs/promises";
import { defineConfig } from "vite";
import yaml from "@rollup/plugin-yaml";
import hmrify from "vite-plugin-hmrify";
import arraybuffer from "vite-plugin-arraybuffer";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    yaml(),
    hmrify(),
    arraybuffer(),
    wasm(),
    {
      name: "tonejs-mid",
      async transform(_, id) {
        if (id.endsWith("?mid")) {
          const file = id.replace(/\?mid$/, "");
          this.addWatchFile(file);
          const buffer = await fs.readFile(file);
          return `
          import { Midi } from "@tonejs/midi";
          import { parseMidi } from "midi-file";

          const buffer = new Uint8Array([${buffer.join(",")}]);
          export const toneJsMidi = new Midi(buffer);
          export const rawMidi = parseMidi(buffer);
          export default toneJsMidi;
          `;
        }
      },
    },
  ],
  esbuild: {
    target: "es2022",
  },
  resolve: {
    alias: {
      "~": "/src",
    },
  },
});
