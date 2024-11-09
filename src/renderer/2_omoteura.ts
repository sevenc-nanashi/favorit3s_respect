import type p5 from "p5";
import type { State } from "../state";
import { midi } from "../midi";
import { dotUnit } from "../const";
import { easeOutQuint } from "../easing";

const leftTrack = midi.tracks.find((track) => track.name === "OmoteUra Left")!;
const rightTrack = midi.tracks.find(
  (track) => track.name === "OmoteUra Right",
)!;
const firstNote = leftTrack.notes.at(0)!;
const lastNote = rightTrack.notes.at(-1)!;

const gridDot = dotUnit * 4;
const gridPadding = dotUnit * 3;

const numGridX = 4;
const numGridY = 8;
const lightDuration = 0.05;
const fadeDuration = 0.025;
const baseMidi =
  [leftTrack.notes, rightTrack.notes]
    .flat()
    .reduce((acc, note) => Math.min(acc, note.midi), 127) - 4;
let bgGraphics: p5.Graphics;
let gridGraphics: p5.Graphics;
let gridGraphics2: p5.Graphics;
const graphicsWidth =
  (gridDot * numGridX + gridPadding * (numGridX - 1)) * 2 + gridPadding;
const graphicsHeight = gridDot * numGridY + gridPadding * (numGridY - 1);
const graphicsPadding = 24;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!bgGraphics) {
    bgGraphics = p.createGraphics(
      graphicsWidth + graphicsPadding * 2,
      graphicsHeight + graphicsPadding * 2,
    );
    gridGraphics = p.createGraphics(
      graphicsWidth + graphicsPadding * 2,
      graphicsHeight + graphicsPadding * 2,
    );
    gridGraphics2 = p.createGraphics(
      graphicsWidth + graphicsPadding * 2,
      graphicsHeight + graphicsPadding * 2,
    );
  }
  bgGraphics.clear();
  gridGraphics.clear();
  gridGraphics.image(gridGraphics2, 0, 0);

  const leftBaseX = graphicsPadding;
  const rightBaseX = graphicsWidth / 2 + gridPadding / 2 + graphicsPadding;
  const baseY = 0;

  if (
    state.currentTick >= lastNote.ticks + lastNote.durationTicks ||
    state.currentMeasure <
      Math.floor(midi.header.ticksToMeasures(firstNote.ticks))
  ) {
    gridGraphics2.clear();
    return;
  }

  bgGraphics.noStroke();
  const gridProgress = Math.min(
    1,
    (state.currentMeasure -
      Math.floor(midi.header.ticksToMeasures(firstNote.ticks))) /
      0.5,
  );
  for (let i = 0; i < numGridX; i++) {
    for (let j = 0; j < numGridY; j++) {
      const rightX = rightBaseX + (gridDot + gridPadding) * i;
      const leftX = leftBaseX + (gridDot + gridPadding) * i;
      const y =
        baseY +
        (gridDot + gridPadding) * j +
        (1 - easeOutQuint(gridProgress)) * dotUnit * 10;

      bgGraphics.fill(255, 64 * gridProgress);
      bgGraphics.rect(rightX, y, gridDot, gridDot);

      bgGraphics.circle(leftX + gridDot / 2, y + gridDot / 2, gridDot);
    }
  }

  const rightActiveNotes = rightTrack.notes.filter(
    (note) =>
      note.time <= state.currentTime &&
      note.time + note.duration + fadeDuration > state.currentTime,
  );

  for (const note of rightActiveNotes) {
    const xIndex = (note.midi - baseMidi) % numGridX;
    const yIndex = numGridY - Math.floor((note.midi - baseMidi) / numGridX) - 1;

    const rightX = rightBaseX + (gridDot + gridPadding) * xIndex;
    const y = baseY + (gridDot + gridPadding) * yIndex;

    const progress = Math.min(
      1,
      (state.currentTime - note.time) / fadeDuration,
    );

    if (state.currentTime - note.time < lightDuration) {
      gridGraphics.noStroke();
      gridGraphics.fill(255, 255);
      gridGraphics.rect(rightX, y, gridDot, gridDot);
    } else {
      gridGraphics.stroke(255, 255 * progress);
      gridGraphics.strokeWeight(dotUnit);
      gridGraphics.noFill();
      gridGraphics.rect(rightX, y, gridDot, gridDot);
    }
  }

  const leftActiveNotes = leftTrack.notes.filter(
    (note) =>
      note.time <= state.currentTime &&
      note.time + note.duration + fadeDuration > state.currentTime,
  );

  for (const note of leftActiveNotes) {
    const xIndex = (note.midi - baseMidi) % numGridX;
    const yIndex = numGridY - Math.floor((note.midi - baseMidi) / numGridX) - 1;

    const leftX = leftBaseX + (gridDot + gridPadding) * xIndex;
    const y = baseY + (gridDot + gridPadding) * yIndex;

    const progress = Math.min(
      1,
      (state.currentTime - note.time) / fadeDuration,
    );

    if (state.currentTime - note.time < lightDuration) {
      gridGraphics.noStroke();
      gridGraphics.fill(255, 255);
      gridGraphics.circle(leftX + gridDot / 2, y + gridDot / 2, gridDot);
    } else {
      gridGraphics.stroke(255, 255 * progress);
      gridGraphics.strokeWeight(dotUnit);
      gridGraphics.noFill();
      gridGraphics.circle(leftX + gridDot / 2, y + gridDot / 2, gridDot);
    }
  }

  const drawBaseX = p.width / 2 - graphicsWidth / 2;
  const drawBaseY = p.height / 2 - graphicsHeight / 2;
  p.image(bgGraphics, drawBaseX, drawBaseY);
  gridGraphics2.clear();
  gridGraphics2.tint(255, 160);
  gridGraphics2.image(gridGraphics, 0, 0);
  p.image(gridGraphics, drawBaseX, drawBaseY);
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      p.tint(255, 16);
      p.image(gridGraphics, drawBaseX + i * dotUnit, drawBaseY + j * dotUnit);
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    bgGraphics?.remove();
  });
}
