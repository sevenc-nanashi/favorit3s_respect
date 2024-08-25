import { midi } from "./midi";

export const width = 1920;
export const height = 1080;

export const bg = [255, 250, 240];
export const fg = [64, 48, 32];
export const fill = [96, 64, 32];

export const frameRate = 60;

export const songLength = midi.header.ticksToSeconds(
  Math.max(
    ...midi.tracks.flatMap((track) =>
      track.notes.map((note) => note.ticks + note.durationTicks),
    ),
  ),
);
