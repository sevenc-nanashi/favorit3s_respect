import type { Track } from "@tonejs/midi";
import type p5 from "p5";
import { dotUnit, frameRate } from "../const";
import { midi } from "../midi";
import type { State } from "../state";

const morseBrightness = 192;
const morseTracks: {
  fg: [number, number, number];
  position: "top" | "left" | "right" | "bottom";
  track: Track;
}[] = [
  {
    fg: [64, 255, 64],
    position: "left",
    track: midi.tracks.find((track) => track.name === "Subeana Morse 1")!,
  },
  {
    fg: [255, 255, 64],
    position: "right",
    track: midi.tracks.find((track) => track.name === "Subeana Morse 2")!,
  },
  {
    fg: [morseBrightness, 64, 64],
    position: "top",
    track: midi.tracks.find((track) => track.name === "Subeyue Morse 1")!,
  },
  {
    fg: [64, morseBrightness, 64],
    position: "left",
    track: midi.tracks.find((track) => track.name === "Subeyue Morse 2")!,
  },
  {
    fg: [64, 64, morseBrightness],
    position: "right",
    track: midi.tracks.find((track) => track.name === "Subeyue Morse 3")!,
  },
  {
    fg: [morseBrightness, morseBrightness, 64],
    position: "bottom",
    track: midi.tracks.find((track) => track.name === "Subeyue Morse 4")!,
  },
  {
    fg: [64, 255, 64],
    position: "left",
    track: midi.tracks.find((track) => track.name === "Iwashi Morse 1")!,
  },
  {
    fg: [255, 255, 64],
    position: "right",
    track: midi.tracks.find((track) => track.name === "Iwashi Morse 2")!,
  },
];

export const draw = import.meta.hmrify((p: p5, state: State) => {
  const size = dotUnit * 2;
  for (const { fg, position, track } of morseTracks) {
    const lastNote = track.notes.find(
      (note) =>
        note.ticks <= state.currentTick &&
        note.ticks + note.durationTicks > state.currentTick,
    );
    if (lastNote) {
      p.fill(...fg);
      p.noStroke();
      const progress = Math.max(
        0,
        Math.min(
          (state.currentFrame / frameRate -
            midi.header.ticksToSeconds(lastNote.ticks) -
            0.025) /
            0.2,
          1,
        ),
      );
      switch (position) {
        case "top":
          if (progress > 0) {
            p.rect(0, 0, (p.width / 3) * (1 - progress), size);
            p.rect(
              p.width * (2 / 3) + (p.width / 3) * progress,
              0,
              (p.width / 3) * (1 - progress),
              size,
            );
          } else {
            p.rect(p.width / 3, 0, p.width / 3, size);
          }
          break;
        case "left":
          if (progress > 0) {
            p.rect(0, 0, size, (p.height / 3) * (1 - progress));
            p.rect(
              0,
              p.height * (2 / 3) + (p.height / 3) * progress,
              size,
              (p.height / 3) * (1 - progress),
            );
          } else {
            p.rect(0, p.height / 3, size, p.height / 3);
          }
          break;
        case "right":
          if (progress > 0) {
            p.rect(p.width - size, 0, size, (p.height / 3) * (1 - progress));
            p.rect(
              p.width - size,
              p.height * (2 / 3) + (p.height / 3) * progress,
              size,
              (p.height / 3) * (1 - progress),
            );
          } else {
            p.rect(p.width - size, p.height / 3, size, p.height / 3);
          }
          break;
        case "bottom":
          if (progress > 0) {
            p.rect(0, p.height - size, (p.width / 3) * (1 - progress), size);
            p.rect(
              p.width * (2 / 3) + (p.width / 3) * progress,
              p.height - size,
              (p.width / 3) * (1 - progress),
              size,
            );
          } else {
            p.rect(p.width / 3, p.height - size, p.width / 3, size);
          }
          break;
      }
    }
  }
});
