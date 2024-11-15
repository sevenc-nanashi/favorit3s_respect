import type p5 from "p5";
import type { State } from "../state";
import { timelineMid } from "../midi";
import chords from "../assets/chord.png";
import { padding } from "./4_info";
import { dotUnit, height } from "../const";
import { easeOutQuint } from "../easing";

const baseMid = 60;

const songsTrack = timelineMid.tracks.find((track) => track.name === "songs")!;
const chordTrack = timelineMid.tracks.find((track) => track.name === "chords")!;

let chordImage: p5.Image;

export const preload = import.meta.hmrify((p: p5) => {
  chordImage = p.loadImage(chords);
});

const destWidth = 682;
const partWidth = 236;
const leftPadding = 86;
const imageLeftPadding = 44;
const imageTopPadding = 8;
const imagePartWidth = 124;
const rowHeight = 80;

const animationWidth = 4;
const animationDuration = 0.5;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!chordImage) {
    preload(p);
    return;
  }
  const isEnded = songsTrack.notes.every(
    (note) => note.ticks + note.durationTicks < state.currentTick,
  );
  if (isEnded) return;
  const activeChord = chordTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (!activeChord) return;

  const index = activeChord.midi - baseMid;
  if (index === -1) return;

  const currentTick = state.currentTick;
  const progress =
    (currentTick - activeChord.ticks) / activeChord.durationTicks;

  const baseX = p.width / 2 - destWidth / 2;
  p.stroke(255, 128);
  p.strokeWeight(dotUnit);
  p.noFill();
  const isHalf = activeChord.velocity <= 0.5;
  const lineY = height - padding - rowHeight;
  let x: number;
  if (isHalf) {
    x = p.lerp(
      p.width / 2 - partWidth / 2,
      p.width / 2 + partWidth / 2,
      progress,
    );
  } else {
    if (progress < 0.5) {
      x = p.map(
        progress,
        0,
        0.5,
        baseX + leftPadding,
        baseX + partWidth + leftPadding,
      );
    } else {
      x = p.map(
        progress,
        0.5,
        1,
        baseX + destWidth - partWidth - leftPadding,
        baseX + destWidth - leftPadding,
      );
    }
  }

  p.line(x, lineY, x, lineY + rowHeight);
  const rate = chordImage.width / destWidth;

  const isContinued = chordTrack.notes.some(
    (note) => note.ticks + note.durationTicks === activeChord.ticks,
  );
  let animationProgress = 1;
  if (!isContinued) {
    animationProgress = p.map(
      state.currentTime,
      activeChord.time,
      activeChord.time + animationDuration,
      0,
      1,
      true,
    );
  }

  p.tint(255, 255 * easeOutQuint(animationProgress));
  if (isHalf) {
    p.image(
      chordImage,
      p.width / 2 -
        partWidth / 2 -
        animationWidth * (1 - easeOutQuint(animationProgress)),
      p.height - padding - rowHeight / rate + imageTopPadding + dotUnit * 2,
      partWidth,
      rowHeight / rate,
      imageLeftPadding,
      rowHeight * index + imageTopPadding,
      imagePartWidth,
      rowHeight,
    );
  } else {
    p.image(
      chordImage,
      baseX - animationWidth * (1 - easeOutQuint(animationProgress)),
      p.height - padding - rowHeight / rate + imageTopPadding + dotUnit * 2,
      destWidth,
      rowHeight / rate,
      0,
      rowHeight * index + imageTopPadding,
      chordImage.width,
      rowHeight,
    );
  }
});
