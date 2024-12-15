import type { Note } from "@tonejs/midi/dist/Note";
import midi from "./assets/main.mid?mid";
import timelineMid, {
  rawMidi as timelineRawMid,
} from "./assets/timeline.mid?mid";

export { midi, timelineMid, timelineRawMid };

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

export const loadTimelineWithText = (
  trackName: string,
  options?: Partial<{
    midis: number[];
  }>,
) => {
  const midis = options?.midis;
  const tonejsMidiTrack = timelineMid.tracks.find(
    (track) => track.name === trackName,
  )!;
  const rawTrack = timelineRawMid.tracks.find((track) =>
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
        (note) =>
          note.ticks + 1 >= acc.time && (!midis || midis.includes(note.midi)),
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
