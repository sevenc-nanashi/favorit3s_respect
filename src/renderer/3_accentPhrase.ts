import type p5 from "p5";
import type { State } from "../state";
import { getCurrentTick, midi } from "../midi";
import { dotUnit, frameRate, mainFont } from "../const";
import type { Track } from "@tonejs/midi";

const morseBrightness = 192;
const track = midi.tracks.find((track) => track.name === "Accent Phrase")!;

export const draw = import.meta.hmrify((p: p5, state: State) => {
});
