import type p5 from "p5";
import type { State } from "../state";
import { midi } from "../midi";
import { dotUnit } from "../const";
import type { Note } from "@tonejs/midi/dist/Note";
import { easeOutQuint } from "../easing";

const track = midi.tracks.find((track) => track.name === "Accent Phrase")!;

const getSections = () => {
  let lastSection: { notes: Note[] } = { notes: [] };
  const sections: { notes: Note[] }[] = [lastSection];
  for (const note of track.notes) {
    if (
      lastSection.notes.length > 0 &&
      midi.header.ticksToMeasures(note.ticks) -
        midi.header.ticksToMeasures(lastSection.notes[0].ticks) >=
        1
    ) {
      lastSection = { notes: [] };
      sections.push(lastSection);
    }

    lastSection.notes.push(note);
  }
  return sections;
};

const sections = getSections();

const width = dotUnit * 64;
const topY = dotUnit * 16;
const topMidi = 98;
const noteHeight = dotUnit * 2;
const fadeOutDuration = 0.1;
export const draw = import.meta.hmrify((p: p5, state: State) => {
  const currentSection = sections.find(
    (section) =>
      midi.header.ticksToMeasures(state.currentTick) >=
        midi.header.ticksToMeasures(section.notes[0].ticks) &&
      (midi.header.ticksToMeasures(state.currentTick) <
        midi.header.ticksToMeasures(
          section.notes[section.notes.length - 1].ticks +
            section.notes[section.notes.length - 1].durationTicks,
        ) ||
        state.currentTime <
          midi.header.ticksToSeconds(
            section.notes[section.notes.length - 1].ticks +
              section.notes[section.notes.length - 1].durationTicks,
          ) +
            fadeOutDuration),
  );

  if (!currentSection) return;

  const fadeOutProgress = Math.max(
    0,
    (state.currentTime -
      midi.header.ticksToSeconds(
        currentSection.notes[currentSection.notes.length - 1].ticks +
          currentSection.notes[currentSection.notes.length - 1].durationTicks,
      )) /
      fadeOutDuration,
  );

  const leftX = p.width / 2 - width / 2;
  const rightX = p.width / 2 + width / 2;
  p.fill(255);
  p.noStroke();
  const ticksStart = currentSection.notes[0].ticks;
  const ticksEnd =
    currentSection.notes[currentSection.notes.length - 1].ticks +
    currentSection.notes[currentSection.notes.length - 1].durationTicks;
  for (const note of currentSection.notes) {
    const noteLeftX = p.map(note.ticks, ticksStart, ticksEnd, leftX, rightX);
    const noteRightX = p.map(
      note.ticks + note.durationTicks,
      ticksStart,
      ticksEnd,
      leftX,
      rightX,
    );
    const noteTopY = topY + (topMidi - note.midi) * noteHeight;

    let brightness = 64;
    if (
      note.ticks <= state.currentTick &&
      state.currentTick <= note.ticks + note.durationTicks
    ) {
      brightness = 255;
    } else if (note.ticks < state.currentTick) {
      brightness = 200;
    }

    p.fill(255, brightness * (1 - fadeOutProgress));
    p.rect(
      Math.round(noteLeftX),
      noteTopY + noteHeight * easeOutQuint(fadeOutProgress),
      Math.round(noteRightX) - Math.round(noteLeftX),
      noteHeight,
    );
  }
});
