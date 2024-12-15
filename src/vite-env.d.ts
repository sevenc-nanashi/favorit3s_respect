/// <reference types="vite/client" />
/// <reference types="vite-plugin-hmrify/client" />
/// <reference types="vite-plugin-arraybuffer/types" />

declare module "*.yml" {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const content: any;
  export default content;
}

declare module "*?mid" {
  import type { Midi } from "@tonejs/midi";
  import type { MidiData } from "midi-file";
  export const tonejsMidi: Midi;
  export const rawMidi: MidiData;
  export default tonejsMidi;
}
