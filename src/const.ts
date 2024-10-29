import { midi } from "./midi";

export const width = 1920;
export const height = 1080;

export const bg = [0, 0, 0];
export const fg = [250, 250, 255];
export const fill = [96, 64, 32];

export const dotUnit = 4;

export const frameRate = 60;

export const mainFont = "美咲ゴシック";
export const engFont = "MSX-WIDTH40J";
export const smallFont = "35-55 Font"
export const songLength = midi.header.ticksToSeconds(
  Math.max(
    ...midi.tracks.flatMap((track) =>
      track.notes.map((note) => note.ticks + note.durationTicks),
    ),
  ),
);
