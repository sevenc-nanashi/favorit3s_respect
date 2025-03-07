import type p5 from "p5";
import { timelineMid } from "../midi";
import type { State } from "../state";

const flashTrack = timelineMid.tracks.find((track) => track.name === "flash")!;
const flashMid = 60;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  const flashNote = flashTrack.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === flashMid,
  );
  if (flashNote) {
    const progress = p.map(
      state.currentTick,
      flashNote.ticks,
      flashNote.ticks + flashNote.durationTicks,
      1,
      0,
    );
    p.fill(255, 255, 255, 255 * progress);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
  }

  const reverseFlashNote = flashTrack.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === flashMid + 1,
  );
  if (reverseFlashNote) {
    const progress = p.map(
      state.currentTick,
      reverseFlashNote.ticks,
      reverseFlashNote.ticks + reverseFlashNote.durationTicks,
      0,
      1,
    );
    p.fill(255, 255, 255, 255 * progress);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
  }
});
