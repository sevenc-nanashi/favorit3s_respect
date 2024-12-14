import { Midi, type Note } from "@tonejs/midi";
import data from "./assets/main.mid?uint8array";
import timelineMidRaw from "./assets/timeline.mid?uint8array";
import { parseMidi } from "midi-file";

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

export const loadTimelineWithText = (trackName: string) => {
  const tonejsMidiTrack = timelineMid.tracks.find(
    (track) => track.name === trackName,
  )!;
  const rawTrack = parseMidi(timelineMidRaw).tracks.find((track) =>
    track.some((note) => note.type === "trackName" && note.text === trackName),
  )!;

  const textEvents = rawTrack.reduce(
    (acc, note) => {
      acc.time += note.deltaTime;
      if (note.type !== "text") {
        return acc;
      }
      const textBytes = note.text.split("").map((char) => char.charCodeAt(0));
      const text = new TextDecoder()
        .decode(new Uint8Array(textBytes))
        .replaceAll("/", "\n");
      const midiNote = tonejsMidiTrack.notes.find(
        (note) => note.ticks >= acc.time,
      );
      if (!midiNote) {
        throw new Error(`No note found at ${acc.time}, ${text}`);
      }
      acc.texts.push({ text, time: acc.time, note: midiNote });
      return acc;
    },
    { texts: [] as { text: string; time: number; note: Note }[], time: 0 },
  );

  return { texts: textEvents.texts, track: tonejsMidiTrack };
};
