import type p5 from "p5";
import { dotUnit, engFont, mainFont, sliceDefinitions } from "../const";
import { midi, timelineMid } from "../midi";
import type { State } from "../state";
import { useGraphicContext } from "../utils";
import { drawFrame } from "../components/frame";
import { easeInQuint, easeOutQuad, easeOutQuint } from "../easing";
import { drawItem } from "../components/body";

const track = timelineMid.tracks.find((track) => track.name === "frame")!;
const kurageTrack = timelineMid.tracks.find(
  (track) => track.name === "frame_kurage",
)!;
const syachiTrack = timelineMid.tracks.find(
  (track) => track.name === "frame_syachi",
)!;
const kuuneruTrack = timelineMid.tracks.find(
  (track) => track.name === "frame_kuuneru",
)!;
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
const innerFrameMidi = 48;
const innerFrameOutMidi = 49;
const outerFrameMidi = 50;
const outerFramePersistMidi = 51;
const kuuneruFrameAnimationMidi = 52;
const kuuneruFramePersistMidi = 53;

const frameFlashMidi = 47;

const yShiftbaseMidi = 60;
const imageSpecifyMidi = 48;
const headImageSpecifyMidi = 36;

const arpHeight = 320;
const arpMidi = 60;
const arpPersist = 0.15;
const arpPadding = dotUnit * 2;
const arpSize = (arpHeight + arpPadding) / 5 - arpPadding;
let dashFrameGraphics: p5.Graphics;

const bassMidi = 72;
const bassPadding = dotUnit * 2;
const bassHeight = 32;

const chordMidi = 73;

const syachiMidi = 48;

const kuuneruBaseMidi = 48;
const kuuneruSquareMidi = 60;

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

  const chordNote = track.notes.findLast(
    (note) => state.currentTime >= note.time && note.midi === chordMidi,
  );
  if (chordNote) {
    using _context = useGraphicContext(p);
    const progress = p.map(
      state.currentTime,
      chordNote.time,
      chordNote.time + chordNote.duration + 0.1,
      0,
      1,
      true,
    );
    const opacity = (1 - easeInQuint(progress)) * 255;
    p.noFill();
    p.stroke(255, opacity);
    p.strokeWeight(dotUnit * 2);

    p.rect(
      p.width / 2 -
        outerSize / 2 -
        dotUnit * 2 -
        arpSize -
        arpPadding -
        dotUnit,
      p.height / 2 - arpHeight / 2,
      arpSize - dotUnit * 2,
      arpSize - dotUnit * 2,
    );
    p.rect(
      p.width / 2 -
        outerSize / 2 -
        dotUnit * 2 -
        arpSize -
        arpPadding -
        dotUnit,
      p.height / 2 + arpHeight / 2 - dotUnit * 2 - arpSize,
      arpSize - dotUnit * 2,
      arpSize - dotUnit * 2,
    );
    p.rect(
      p.width / 2 -
        outerSize / 2 -
        dotUnit * 2 -
        arpSize -
        arpPadding -
        dotUnit,
      p.height / 2 - arpHeight / 2 + arpSize + arpPadding,
      arpSize - dotUnit * 2,
      arpHeight - arpSize * 2 - arpPadding * 4,
    );
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
      arpNote.time,
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

    const opacity = (1 - easeOutQuad(progress)) * 255;
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

  const yShift = kurageTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      yShiftbaseMidi <= note.midi &&
      note.midi < yShiftbaseMidi + 12,
  );
  const imageIndex = kurageTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi >= imageSpecifyMidi &&
      note.midi < imageSpecifyMidi + 12,
  );
  const headImageIndex = kurageTrack.notes.findLast(
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

  const syachiYShift = syachiTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      syachiMidi >= note.midi &&
      note.midi >= syachiMidi - 12,
  );
  if (syachiYShift) {
    using _context = useGraphicContext(p);
    p.translate(p.width / 2, p.height / 2 + dashSize / 2 - dotUnit * 2);
    p.scale(dotUnit);

    drawItem(
      p,
      state,
      textureImages,
      "tsumugi",
      syachiMidi - syachiYShift.midi,
    );
  }

  const kuuneruGap = p.width / 6;
  const kuuneruLeft = kuuneruGap;
  const kuuneruRight = p.width / 2 - kuuneruGap / 4;
  const kuuneruTop = p.height / 2 - (kuuneruRight - kuuneruLeft) / 2;
  const kuuneruBottom = p.height / 2 + (kuuneruRight - kuuneruLeft) / 2;

  const kuuneruSquareGap = dotUnit * 4;
  const kuuneruSquareSize = (kuuneruBottom - kuuneruTop - kuuneruSquareGap) / 2;

  const kuuneruNote = track.notes.findLast(
    (note) =>
      note.ticks <= state.currentTick &&
      note.ticks + note.durationTicks >= state.currentTick &&
      (note.midi === kuuneruFrameAnimationMidi ||
        note.midi === kuuneruFramePersistMidi),
  );
  let kuuneruProgress = 0;
  if (kuuneruNote) {
    if (kuuneruNote.midi === kuuneruFramePersistMidi) {
      kuuneruProgress = 1;
    } else {
      kuuneruProgress = p.map(
        state.currentTime,
        kuuneruNote.time,
        kuuneruNote.time + kuuneruNote.duration,
        0,
        1,
        true,
      );
    }
  }

  const frameLeft = p.lerp(
    p.width / 2 - outerSize / 2,
    kuuneruLeft,
    kuuneruProgress,
  );
  const frameRight = p.lerp(
    p.width / 2 + outerSize / 2,
    kuuneruRight,
    kuuneruProgress,
  );
  const frameTop = p.lerp(
    p.height / 2 - outerSize / 2,
    kuuneruTop,
    kuuneruProgress,
  );
  const frameBottom = p.lerp(
    p.height / 2 + outerSize / 2,
    kuuneruBottom,
    kuuneruProgress,
  );
  if (kuuneruProgress > 0) {
    using _context = useGraphicContext(p);
    p.noFill();
    p.stroke(255);
    p.strokeWeight(dotUnit * 2);

    p.rect(frameLeft, frameTop, frameRight - frameLeft, frameBottom - frameTop);
  }

  const currentKuuneruNote = kuuneruTrack.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi >= kuuneruBaseMidi &&
      note.midi < kuuneruBaseMidi + 12,
  );
  if (currentKuuneruNote) {
    using _context = useGraphicContext(p);
    p.translate((kuuneruLeft + kuuneruRight) / 2, kuuneruBottom - dotUnit * 2);
    p.scale(dotUnit);
    const zundamonSlice =
      sliceDefinitions[
        `kuuneru_zundamon_${currentKuuneruNote.midi - kuuneruBaseMidi}`
      ];
    const tsumugiSlice =
      sliceDefinitions[
        `kuuneru_tsumugi_${currentKuuneruNote.midi - kuuneruBaseMidi}`
      ];
    p.noSmooth();
    p.scale(1.25);
    p.image(
      textureImages["0.png"],
      Math.floor(-zundamonSlice.width * 1.2),
      -zundamonSlice.height,
      zundamonSlice.width,
      zundamonSlice.height,
      zundamonSlice.start[0],
      zundamonSlice.start[1],
      zundamonSlice.width,
      zundamonSlice.height,
    );
    p.image(
      textureImages["0.png"],
      Math.floor(tsumugiSlice.width * 0.2),
      -tsumugiSlice.height,
      tsumugiSlice.width,
      tsumugiSlice.height,
      tsumugiSlice.start[0],
      tsumugiSlice.start[1],
      tsumugiSlice.width,
      tsumugiSlice.height,
    );
  }

  const kuuneruSquareNotes = kuuneruTrack.notes.filter(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi >= kuuneruSquareMidi &&
      note.midi < kuuneruSquareMidi + 8,
  );

  const kuuneruSquareBaseLeft = p.width - kuuneruRight;
  const kuuneruSquareBaseTop = kuuneruTop;
  for (const kuuneruSquareNote of kuuneruSquareNotes) {
    using _context = useGraphicContext(p);
    let l = 0;
    let r = 0;
    let t = 0;
    let b = 0;

    const progress =
      (kuuneruSquareNote.midi - kuuneruSquareMidi) % 2 === 0
        ? p.map(
            state.currentTime,
            kuuneruSquareNote.time,
            kuuneruSquareNote.time + kuuneruSquareNote.duration,
            0,
            1,
            true,
          )
        : 1;

    switch (Math.floor((kuuneruSquareNote.midi - kuuneruSquareMidi) / 2)) {
      case 0:
        l = 0;
        r = kuuneruSquareSize;
        b = kuuneruSquareGap + kuuneruSquareSize * 2;
        t = p.lerp(b, kuuneruSquareSize + kuuneruSquareGap, progress);
        break;
      case 1:
        t = 0;
        b = kuuneruSquareSize;
        l = 0;
        r = p.lerp(0, kuuneruSquareSize, progress);
        break;
      case 2:
        l = kuuneruSquareSize + kuuneruSquareGap;
        r = kuuneruSquareSize * 2 + kuuneruSquareGap;
        t = 0;
        b = p.lerp(0, kuuneruSquareSize, progress);
        break;
      case 3:
        t = kuuneruSquareSize + kuuneruSquareGap;
        b = kuuneruSquareSize * 2 + kuuneruSquareGap;
        l = p.lerp(b, kuuneruSquareSize + kuuneruSquareGap, progress);
        r = kuuneruSquareSize * 2 + kuuneruSquareGap;
        break;
    }
    p.rect(kuuneruSquareBaseLeft + l, kuuneruSquareBaseTop + t, r - l, b - t);
  }
  const kuuneruOuterSquare = kuuneruTrack.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi >= kuuneruSquareMidi + 13 &&
      note.midi < kuuneruSquareMidi + 15,
  );
  if (kuuneruOuterSquare) {
    using _context = useGraphicContext(p);
    const progress =
      kuuneruOuterSquare.midi === kuuneruSquareMidi + 13
        ? p.map(
            state.currentTime,
            kuuneruOuterSquare.time,
            kuuneruOuterSquare.time + kuuneruOuterSquare.duration,
            0,
            1,
            true,
          )
        : 1;
    p.fill(255, 255 * progress);
    p.noStroke();
    p.rect(
      kuuneruSquareBaseLeft - kuuneruSquareGap,
      kuuneruSquareBaseTop - kuuneruSquareGap,
      kuuneruSquareSize * 2 + kuuneruSquareGap * 3,
      kuuneruSquareSize * 2 + kuuneruSquareGap * 3,
    );
  }

  const kuuneruCyanFiller = kuuneruTrack.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      (note.midi === kuuneruSquareMidi + 8 ||
        note.midi === kuuneruSquareMidi + 9),
  );
  if (kuuneruCyanFiller) {
    using _context = useGraphicContext(p);
    const progress =
      kuuneruCyanFiller.midi === kuuneruSquareMidi + 8
        ? p.map(
            state.currentTime,
            kuuneruCyanFiller.time,
            kuuneruCyanFiller.time + kuuneruCyanFiller.duration,
            0,
            1,
            true,
          )
        : 1;
    if (kuuneruCyanFiller.midi === kuuneruSquareMidi + 8) {
      p.fill(128, 192, 192);
    } else {
      p.fill(128, 192, 255);
    }
    const bottomProgress = p.map(progress, 0, 0.5, 0, 1, true);
    const topProgress = p.map(progress, 0.5, 1, 0, 1, true);
    p.rect(
      kuuneruSquareBaseLeft,
      kuuneruSquareBaseTop +
        kuuneruSquareSize * 2 +
        kuuneruSquareGap -
        kuuneruSquareSize * bottomProgress,
      kuuneruSquareSize,
      kuuneruSquareSize * bottomProgress,
    );
    p.rect(
      kuuneruSquareBaseLeft + kuuneruSquareSize + kuuneruSquareGap,
      kuuneruSquareBaseTop +
        kuuneruSquareSize * 2 +
        kuuneruSquareGap -
        kuuneruSquareSize * bottomProgress,
      kuuneruSquareSize,
      kuuneruSquareSize * bottomProgress,
    );
    p.rect(
      kuuneruSquareBaseLeft + kuuneruSquareSize + kuuneruSquareGap,
      kuuneruSquareBaseTop +
        kuuneruSquareSize -
        kuuneruSquareSize * topProgress,
      kuuneruSquareSize,
      kuuneruSquareSize * topProgress,
    );
    p.rect(
      kuuneruSquareBaseLeft,
      kuuneruSquareBaseTop +
        kuuneruSquareSize -
        kuuneruSquareSize * topProgress,
      kuuneruSquareSize,
      kuuneruSquareSize * topProgress,
    );
  }

  const kuuneruHighPassFrq = kuuneruTrack.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi === kuuneruSquareMidi + 10,
  );
  if (kuuneruHighPassFrq) {
    using _context = useGraphicContext(p);
    const progress = p.map(
      state.currentTime,
      kuuneruHighPassFrq.time,
      kuuneruHighPassFrq.time + kuuneruHighPassFrq.duration,
      1,
      0,
      true,
    );
    p.noStroke();
    p.fill(64, 255, 64);
    const height = (kuuneruBottom - kuuneruTop - dotUnit * 4) * progress;
    p.rect(
      kuuneruLeft + dotUnit * 2,
      kuuneruBottom - height - dotUnit * 2,
      dotUnit * 2,
      height,
    );

    p.textSize(24);
    p.textFont(mainFont);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text("Frq", kuuneruLeft, kuuneruTop - dotUnit * 2);
  }
  const kuuneruHighPassQ = kuuneruTrack.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi >= kuuneruSquareMidi + 11 &&
      note.midi < kuuneruSquareMidi + 13,
  );
  if (kuuneruHighPassQ) {
    using _context = useGraphicContext(p);
    const progress =
      kuuneruHighPassQ.midi === kuuneruSquareMidi + 11
        ? p.map(
            state.currentTime,
            kuuneruHighPassQ.time,
            kuuneruHighPassQ.time + kuuneruHighPassQ.duration,
            0.75,
            1,
            true,
          )
        : p.map(
            state.currentTime,
            kuuneruHighPassQ.time,
            kuuneruHighPassQ.time + kuuneruHighPassQ.duration,
            1,
            0,
            true,
          );
    p.noStroke();
    p.fill(255, 255, 64);
    const height = (kuuneruBottom - kuuneruTop - dotUnit * 4) * progress;
    p.rect(
      kuuneruRight - dotUnit * 4,
      kuuneruBottom - height - dotUnit * 2,
      dotUnit * 2,
      height,
    );
    p.textSize(24);
    p.textFont(engFont);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text("Q", kuuneruRight, kuuneruTop - dotUnit * 2);
  }

  const frameFlash = track.notes.findLast(
    (note) =>
      state.currentTime >= note.time &&
      state.currentTime < note.time + note.duration &&
      note.midi === frameFlashMidi,
  );
  if (frameFlash) {
    const progress = p.map(
      state.currentTime,
      frameFlash.time,
      frameFlash.time + frameFlash.duration,
      1 - frameFlash.velocity,
      1,
      true,
    );
    const opacity = (1 - progress) * 255;
    p.fill(255, opacity);
    p.rect(frameLeft, frameTop, frameRight - frameLeft, frameBottom - frameTop);
  }
});
