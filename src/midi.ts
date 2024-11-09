import { Midi } from "@tonejs/midi";
import data from "./assets/main.mid?uint8array";
import timelineMidRaw from "./assets/timeline.mid?uint8array";

export const midi = new Midi(data);
midi.tracks = midi.tracks.filter((track) => !track.name.startsWith("#"));

export const timelineMid = new Midi(timelineMidRaw);

export const measureToTicks = (measure: number): number => {
  const lastTimeSignature = midi.header.timeSignatures.findLast(
    (timeSignature) => timeSignature.ticks <= measure,
  )!;
  const ticksPerMeasure =
    lastTimeSignature.timeSignature[0] *
    (midi.header.ppq * (4 / lastTimeSignature.timeSignature[1]));
  const ticks =
    ticksPerMeasure * (measure - lastTimeSignature.ticks) +
    lastTimeSignature.ticks;
  return ticks;
};

export const trackMeasures = midi.tracks.map((track) => {
  const measures = new Set(
    track.notes.flatMap((note) => {
      const start = Math.floor(midi.header.ticksToMeasures(note.ticks));
      const end = Math.floor(
        midi.header.ticksToMeasures(note.ticks + note.durationTicks - 1),
      );

      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }),
  );

  return measures;
});
