import type p5 from "p5";
import { dotUnit, sliceDefinitions } from "../const";
import { midi, timelineMid } from "../midi";
import type { State } from "../state";
import { useGraphicContext } from "../utils";
import { drawFrame } from "../components/frame";
import { easeInQuint, easeOutQuint } from "../easing";

const track = timelineMid.tracks.find((track) => track.name === "frame")!;
const starTrack = midi.tracks.find((track) => track.name === "Shooting Star")!;
const mainDrum = midi.tracks.find((track) => track.name === "Drum 1")!;
const kickMidi = 36;
const starMidi = 48;

const textures = import.meta.glob("../assets/textures/*.png", {
  eager: true,
}) as Record<string, { default: string }>;
const textureImages: Record<string, p5.Image> = {};

export const preload = import.meta.hmrify((p: p5) => {
  for (const [path, image] of Object.entries(textures)) {
    const filename = path.split("/").pop()!;
    textureImages[filename] = p.loadImage(image.default);
  }
});

const innerSize = 300;
const outerSize = 350;
const rectSize = 100;
const dashSize = 320;
const dashDiv = 12;
const dashWidth = (dashSize + dotUnit * 4) / dashDiv;
const innerFrameMidi = 72;
const innerFrameOutMidi = 73;
const outerFrameMidi = 74;
const outerFramePersistMidi = 75;

const yShiftbaseMidi = 60;
const imageSpecifyMidi = 48;
const headImageSpecifyMidi = 36;

const arpHeight = 320;
const arpMidi = 84;
const arpPersist = 0.15;
const arpPadding = dotUnit * 2;
const arpSize = (arpHeight + arpPadding) / 5 - arpPadding;
let dashFrameGraphics: p5.Graphics;

const bassMidi = 96;
const bassPadding = dotUnit * 2;
const bassHeight = 32;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!dashFrameGraphics) {
    dashFrameGraphics = p.createGraphics(outerSize, outerSize);
  }
  if (Object.keys(textureImages).length === 0) {
    preload(p);
    return;
  }

  p.noStroke();
  p.fill(255);

  const innerFrame = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === innerFrameMidi,
  );
  if (innerFrame) {
    const progress = p.map(
      state.currentTick,
      innerFrame.ticks,
      innerFrame.ticks + innerFrame.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      progress,
      p.width / 2,
      p.height / 2 - innerSize / 2,
      innerSize,
      dotUnit * 2,
    );
  }

  const innerFrameOut = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === innerFrameOutMidi,
  );
  if (innerFrameOut) {
    const progress = p.map(
      state.currentTick,
      innerFrameOut.ticks,
      innerFrameOut.ticks + innerFrameOut.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      -progress,
      p.width / 2,
      p.height / 2 - innerSize / 2,
      innerSize,
      dotUnit * 2,
    );
  }

  const outerFrame = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === outerFrameMidi,
  );
  if (outerFrame) {
    const progress = p.map(
      state.currentTick,
      outerFrame.ticks,
      outerFrame.ticks + outerFrame.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      progress,
      p.width / 2,
      p.height / 2 - outerSize / 2,
      outerSize,
      dotUnit * 2,
    );
  }

  if (innerFrame || innerFrameOut || outerFrame) {
    using _context = useGraphicContext(p);
    const lastKick = mainDrum.notes.findLast(
      (note) => note.ticks <= state.currentTick && note.midi === kickMidi,
    );
    let additionalSize = 0;
    if (lastKick) {
      additionalSize = p.map(
        state.currentTime,
        lastKick.time,
        lastKick.time + 0.2,
        dotUnit * 2,
        0,
        true,
      );
    }
    const computedRectSize = rectSize + additionalSize;
    p.fill(255);
    p.rect(
      p.width / 2 - computedRectSize / 2,
      p.height / 2 - computedRectSize / 2,
      computedRectSize,
      computedRectSize,
    );
  }

  const outerFramePersist = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === outerFramePersistMidi,
  );
  if (outerFramePersist) {
    drawFrame(
      p,
      1,
      p.width / 2,
      p.height / 2 - outerSize / 2,
      outerSize,
      dotUnit * 2,
    );
    const starNote = starTrack.notes.findLast(
      (note) => state.currentTick >= note.ticks && note.midi === starMidi,
    );
    if (starNote) {
      const opacity = p.map(
        state.currentTime,
        starNote.time,
        starNote.time + 6,
        255,
        0,
        true,
      );
      if (opacity > 0) {
        using _context = useGraphicContext(p);
        dashFrameGraphics.clear();
        dashFrameGraphics.noErase();
        dashFrameGraphics.fill(255);
        dashFrameGraphics.noStroke();
        drawFrame(
          dashFrameGraphics,
          1,
          outerSize / 2,
          outerSize / 2 - dashSize / 2,
          dashSize,
          dotUnit * 2,
        );
        const toggle = Math.floor(state.currentFrame / 2) % 2;
        dashFrameGraphics.erase();
        for (
          //let x = outerSize / 2 - dashSize / 2 - dotUnit * 2;
          //x <= outerSize / 2 + dashSize / 2 + dotUnit * 2;
          //x += dashWidth
          let nx = 0;
          nx < dashDiv;
          nx++
        ) {
          const x = outerSize / 2 - dashSize / 2 - dotUnit * 2 + nx * dashWidth;
          for (let ny = 0; ny < dashDiv; ny++) {
            const y =
              outerSize / 2 - dashSize / 2 - dotUnit * 2 + ny * dashWidth;
            if ((nx + ny) % 2 === toggle) {
              continue;
            }
            dashFrameGraphics.rect(x, y, dashWidth, dashWidth);
          }
        }
        p.tint(255, opacity);
        p.image(
          dashFrameGraphics,
          p.width / 2 - outerSize / 2,
          p.height / 2 - outerSize / 2,
        );
      }
    }
  }

  const arpNotes = track.notes.filter(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration + arpPersist &&
      note.midi >= arpMidi &&
      note.midi < arpMidi + 12,
  );
  for (const [i, arpNote] of arpNotes.entries()) {
    if (arpNotes.findLastIndex((note) => note.midi === arpNote.midi) !== i) {
      continue;
    }
    const progress = p.map(
      state.currentTime,
      arpNote.time + arpNote.duration,
      arpNote.time + arpNote.duration + arpPersist,
      0,
      1,
      true,
    );
    const x = p.width / 2 + outerSize / 2 + dotUnit * 6;
    const y =
      p.height / 2 +
      arpHeight / 2 -
      (arpSize + arpPadding) * (arpNote.midi - arpMidi + 1) +
      arpPadding;

    const opacity = (1 - easeOutQuint(progress)) * 255;
    p.fill(255, opacity);
    drawFrame(p, 1, x + arpSize / 2, y, arpSize, -dotUnit * 2);
  }

  const bassNote = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === bassMidi,
  );
  if (bassNote) {
    const progress = p.map(
      state.currentTick,
      bassNote.ticks,
      bassNote.ticks + bassNote.durationTicks,
      0,
      1,
      true,
    );
    const opacity = progress * 255;
    p.fill(255, opacity);
    p.rect(
      p.width / 2 - outerSize / 2 - dotUnit * 2,
      p.height / 2 + outerSize / 2 + dotUnit * 2 + bassPadding,
      outerSize + dotUnit * 4,
      bassHeight,
    );
    const interval = Math.floor(state.currentFrame / 4) % 3;
    for (let i = 0; i < 5; i++) {
      if (i % 3 !== interval) {
        continue;
      }
      p.fill(255, opacity * (1 - easeInQuint(i / 5)));
      p.rect(
        p.width / 2 - outerSize / 2 - dotUnit * 2,
        p.height / 2 +
          outerSize / 2 +
          dotUnit * 2 +
          bassPadding +
          bassHeight +
          dotUnit +
          dotUnit * 2 * i,
        outerSize + dotUnit * 4,
        dotUnit * 2,
      );
    }
  }

  const yShift = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      yShiftbaseMidi <= note.midi &&
      note.midi < yShiftbaseMidi + 12,
  );
  const imageIndex = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi >= imageSpecifyMidi &&
      note.midi < imageSpecifyMidi + 12,
  );
  const headImageIndex = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi >= headImageSpecifyMidi &&
      note.midi < headImageSpecifyMidi + 12,
  );
  if (yShift && imageIndex && headImageIndex) {
    using _context = useGraphicContext(p);
    p.translate(p.width / 2, p.height / 2 + dashSize / 2 - dotUnit * 2);
    p.scale(dotUnit);
    p.image(
      textureImages[`${headImageIndex.midi - headImageSpecifyMidi}.png`],
      -sliceDefinitions.kurage.width / 2,
      -sliceDefinitions.kurage.height - (yShift.midi - yShiftbaseMidi),
      sliceDefinitions.kurage.width,
      sliceDefinitions.kurage.moveHeight,
      sliceDefinitions.kurage.start[0],
      sliceDefinitions.kurage.start[1],
      sliceDefinitions.kurage.width,
      sliceDefinitions.kurage.moveHeight,
    );
    p.image(
      textureImages[`${imageIndex.midi - imageSpecifyMidi}.png`],
      -sliceDefinitions.kurage.width / 2,
      -sliceDefinitions.kurage.height -
        (yShift.midi - yShiftbaseMidi) +
        sliceDefinitions.kurage.moveHeight,
      sliceDefinitions.kurage.width,
      sliceDefinitions.kurage.height - sliceDefinitions.kurage.moveHeight,
      sliceDefinitions.kurage.start[0],
      sliceDefinitions.kurage.start[1] + sliceDefinitions.kurage.moveHeight,
      sliceDefinitions.kurage.width,
      sliceDefinitions.kurage.height - sliceDefinitions.kurage.moveHeight,
    );
  }
});
