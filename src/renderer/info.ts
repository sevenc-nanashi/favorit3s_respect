import type p5 from "p5";
import rawChords from "../assets/chords.yml";
import type { State } from "../state";
import { getCurrentMeasure, getCurrentTick } from "../midi";
import { dotUnit, engFont, fg, mainFont } from "../const";
import { beatVisualizer } from "../components/beatVisualizer";
import songsRaw from "../assets/songs.txt?raw";
import songsMidRaw from "../assets/songs.mid?uint8array";
import { Midi } from "@tonejs/midi";
import {
  drumVisualizer,
  drumVisualizerWidth,
} from "../components/drumVisualizer";

const songs = songsRaw.split("\n");
const songsMid = new Midi(songsMidRaw);

let graphics: p5.Graphics;

const padding = 24;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!graphics) {
    graphics = p.createGraphics(p.width, p.height);
  }
  graphics.clear();

  graphics.textSize(24);
  graphics.textFont(mainFont);
  graphics.fill(fg);
  graphics.textAlign(p.LEFT, p.BOTTOM);

  const currentTick = getCurrentTick(state);
  const activeSong = songsMid.tracks[0].notes
    .filter(
      (note) =>
        note.ticks <= currentTick &&
        note.ticks + note.durationTicks > currentTick,
    )
    .map((note) => note.midi - 60)
    .toSorted((a, b) => a - b);
  graphics.text(
    activeSong
      .map(
        (note) =>
          `${(note + 1).toString().padStart(2, "0")}  ${songs[note].replaceAll("$", "\n      ")}`,
      )
      .join("\n") || "テキスト見本\nテキスト見本",
    padding,
    p.height - padding,
  );

  graphics.textAlign(p.RIGHT, p.BOTTOM);

  graphics.textAlign(p.LEFT, p.TOP);
  graphics.text("Key: B major", padding, padding);

  graphics.textAlign(p.RIGHT, p.TOP);
  graphics.text(`FPS: ${p.frameRate().toFixed(2)}`, p.width - padding, padding);

  beatVisualizer(
    graphics,
    state,
    p.width - padding - drumVisualizerWidth - dotUnit * 3,
    p.height - padding,
  );
  drumVisualizer(graphics, state, p.width - padding, p.height - padding);

  p.image(graphics, 0, 0);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graphics.remove();
  });
}
