import type p5 from "p5";
import type { State } from "../state";
import { getCurrentTick } from "../midi";
import { dotUnit, engFont, fg, frameRate, mainFont } from "../const";
import { beatVisualizer } from "../components/beatVisualizer";
import songsRaw from "../assets/songs.txt?raw";
import songsMidRaw from "../assets/songs.mid?uint8array";
import { Midi } from "@tonejs/midi";
import {
  drumVisualizer,
  drumVisualizerHeight,
} from "../components/drumVisualizer";
import { easeOutQuint } from "../easing";

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
  graphics.fill(...fg);

  const currentTick = getCurrentTick(state);
  const activeSong = songsMid.tracks[0].notes
    .filter(
      (note) =>
        note.ticks <= currentTick &&
        note.ticks + note.durationTicks > currentTick,
    )
    .toSorted((a, b) => a.midi - b.midi);
  const isEnded = currentTick >= songsMid.durationTicks;
  graphics.textAlign(p.LEFT, p.TOP);
  const songListBaseY = p.height - padding - 24 * 3;
  if (isEnded) {
    for (let i = 0; i < 3; i++) {
      graphics.text("テキスト見本", padding, songListBaseY + i * 24);
    }
  } else {
    const missingFillerHeight = 3 - activeSong.length;
    const songListY = songListBaseY + missingFillerHeight * 24;
    for (const [i, note] of activeSong.entries()) {
      const index = note.midi - 60;
      const song = songs[index];
      const progress = Math.min(
        (state.currentFrame / frameRate -
          songsMid.header.ticksToSeconds(note.ticks)) /
          0.5,
        1,
      );
      graphics.fill(...fg, 255 * (easeOutQuint(progress) * 0.5 + 0.5));
      if (song.includes("ǂ")) {
        const [left, right] = song.split("ǂ");
        const y = songListY + i * 24 + 9 * (1 - easeOutQuint(progress));
        const leftFull = `${(index + 1).toString().padStart(2, "0")}  ${left}`;
        graphics.text(leftFull, padding, y);
        const leftWidth = graphics.textWidth(leftFull);
        graphics.rect(padding + leftWidth, y + 4, 12, 3);
        graphics.rect(padding + leftWidth, y + 12, 12, 3);
        graphics.rect(padding + leftWidth + 5, y, 3, 21);
        graphics.text(right, padding + leftWidth + 15, y);
      } else {
        graphics.text(
          `${(index + 1).toString().padStart(2, "0")}  ${song}`,
          padding,
          songListY + i * 24 + 9 * (1 - easeOutQuint(progress)),
        );
      }
      graphics.fill(...fg);
    }
  }

  graphics.rect(
    padding,
    p.height - padding - 24 * 3 - padding - dotUnit,
    p.width - padding * 2,
    dotUnit,
  );
  graphics.fill(255, 0, 0);
  graphics.rect(
    p.width / 2 - 260,
    p.height - padding - drumVisualizerHeight,
    240,
    drumVisualizerHeight,
  );
  graphics.rect(
    p.width / 2 + 20,
    p.height - padding - drumVisualizerHeight,
    240,
    drumVisualizerHeight,
  );
  beatVisualizer(
    graphics,
    state,
    p.width / 2 + 260 + dotUnit * 4,
    p.height - padding,
  );

  graphics.fill(255);
  graphics.textAlign(p.RIGHT, p.TOP);
  graphics.text(`FPS: ${p.frameRate().toFixed(2)}`, p.width - padding, padding);

  drumVisualizer(graphics, state, p.width - padding, p.height - padding);

  p.image(graphics, 0, 0);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graphics?.remove();
  });
}
