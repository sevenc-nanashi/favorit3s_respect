import type { Track } from "@tonejs/midi";
import type { Note } from "@tonejs/midi/dist/Note";
import type p5 from "p5";
import { dotUnit, frameRate } from "../const";
import { easeInQuint, easeOutQuint } from "../easing";
import { midi, timelineMid } from "../midi";
import type { State } from "../state";

const starTrack = midi.tracks.find((track) => track.name === "Shooting Star")!;
const mainDrum = midi.tracks.find((track) => track.name === "Drum 1")!;
const mainDrum2 = midi.tracks.find((track) => track.name === "Drum 2")!;
const subDrum = midi.tracks.find((track) => track.name === "RVK-808")!;
const cymbalDrum = midi.tracks.find((track) => track.name === "SI-Drum Kit")!;
const apSection = timelineMid.tracks.find(
  (track) => track.name === "ap_section",
)!;

type DrumDefinition = {
  kick: number;
  snare: number;
  hihat: number;
  openHihat: number;
  clap: number;
  star: number;
};
const drumDefinition = [
  [
    mainDrum,
    {
      kick: 36,
      snare: 37,
      hihat: 38,
      openHihat: 41,
      clap: 40,
    },
  ],
  [
    starTrack,
    {
      star: 48,
    },
  ],
] as [midi: Track, definition: Partial<DrumDefinition>][];

const cymbalWidth = dotUnit * 6;
const cymbalPadding = dotUnit * 1;
const cymbalWidthPadded = cymbalWidth + cymbalPadding;
const cymbalSeparatorWidth = dotUnit * 1;
const cellWidth = dotUnit * 12;
const cellHeight = cellWidth;
const shiftHeight = cellHeight + dotUnit * 2;
const cellPadding = dotUnit * 3;
const cellSectionSize = cellWidth * 8 + cellPadding * 7 + dotUnit * 2;

const animationStart = 1.25;
const animationEnd = 1.75;
const animationMeasure = 0.5;

const color = [64, 192, 255];

export const drumVisualizerWidth =
  cymbalWidthPadded * 2 + cellSectionSize + cymbalSeparatorWidth * 2;
export const drumVisualizerHeight = cellHeight + dotUnit * 2;
export const drumVisualizer = (
  graphics: p5.Graphics,
  state: State,
  baseX: number,
  baseY: number,
) => {
  graphics.noStroke();

  const currentTimeSignature = midi.header.timeSignatures.findLast(
    (v) => v.ticks <= state.currentTick,
  )!;
  const beats =
    (currentTimeSignature.timeSignature[0] /
      currentTimeSignature.timeSignature[1]) *
    8;
  const lastClap = mainDrum2.notes.findLast(
    (note) => note.ticks <= state.currentTick && note.midi === 40,
  );
  let clapWaveShift = 0;
  let clapWaveLevel = 0;
  if (lastClap) {
    const clapTime = midi.header.ticksToSeconds(lastClap.ticks);
    const currentTime = state.currentFrame / frameRate;
    clapWaveLevel = Math.max(lastClap.velocity * 0.75 - 0.25, 0);
    clapWaveShift = Math.max(0, 1 - (currentTime - clapTime) / 0.5);
  }
  for (let i = 0; i <= 8; i++) {
    graphics.fill(255, i % beats === 0 ? 255 : i > beats ? 64 : 128);
    const fromLeftIndex = 8 - i;
    const beatAnimationStart = graphics.map(
      fromLeftIndex,
      0,
      8,
      animationStart,
      animationEnd,
    );
    const beatAnimationEnd = beatAnimationStart + animationMeasure;
    const animationProgress = graphics.map(
      state.currentMeasure,
      beatAnimationStart,
      beatAnimationEnd,
      0,
      1,
      true,
    );

    let heightLevel = 0.5;
    if (i % 2 === 1) {
      heightLevel *= 0.5;
    }
    if (i % beats === 0) {
      heightLevel = 1 + easeInQuint(clapWaveShift) * clapWaveLevel;
    } else if (i > beats) {
      heightLevel *= 0.75;
    }
    const height = drumVisualizerHeight * heightLevel;

    const animatedHeight = easeOutQuint(animationProgress) * height;

    graphics.rect(
      baseX -
        cymbalWidthPadded -
        cymbalSeparatorWidth -
        i * cellWidth -
        i * cellPadding,
      baseY - animatedHeight,
      dotUnit,
      animatedHeight,
    );
  }

  const currentTick = state.currentTick;

  const lastCymbal = [
    subDrum.notes.findLast(
      (note) => note.ticks <= currentTick && note.midi === 50,
    ),
    cymbalDrum.notes.findLast(
      (note) => note.ticks <= currentTick && note.midi === 49,
    ),
  ]
    .filter((note) => note !== undefined)
    .toSorted((a, b) => a!.ticks - b!.ticks)
    .at(-1)!;
  if (lastCymbal) {
    const cymbalTime = midi.header.ticksToSeconds(lastCymbal.ticks);
    const currentTime = state.currentFrame / frameRate;
    graphics.fill(
      255,
      Math.max(0, 255 - (255 * (currentTime - cymbalTime)) / 1),
    );
    const widthFactor = lastCymbal.midi === 49 ? 1 : 0.5;
    graphics.rect(
      baseX - drumVisualizerWidth + cymbalWidth * (1 - widthFactor),
      baseY - drumVisualizerHeight,
      cymbalWidth * widthFactor,
      drumVisualizerHeight,
    );
    graphics.rect(
      baseX - cymbalWidth,
      baseY - drumVisualizerHeight,
      cymbalWidth * widthFactor,
      drumVisualizerHeight,
    );
  }

  let shootingStar: Note | undefined;
  const kicks: Note[] = [];
  const snares: Note[] = [];
  const hihats: Note[] = [];
  const openHihats: Note[] = [];
  const claps: Note[] = [];

  const currentMeasure = state.currentMeasure;
  const startMeasure = Math.max(0, Math.floor(currentMeasure) - 2);
  const endMeasure = Math.floor(currentMeasure) + 1;
  const currentApSectionIndex = apSection.notes.findLastIndex(
    (section) => section.ticks <= currentTick,
  );
  for (const [track, definition] of drumDefinition) {
    for (const note of track.notes) {
      if (
        apSection.notes.findLastIndex((s) => s.ticks <= note.ticks) !==
        currentApSectionIndex
      ) {
        continue;
      }
      const measure = midi.header.ticksToMeasures(note.ticks);
      if (measure >= startMeasure && measure < endMeasure) {
        if (note.midi === definition.kick) {
          kicks.push(note);
        } else if (note.midi === definition.snare) {
          snares.push(note);
        } else if (note.midi === definition.hihat) {
          hihats.push(note);
        } else if (note.midi === definition.openHihat) {
          openHihats.push(note);
        } else if (note.midi === definition.clap) {
          claps.push(note);
        } else if (note.midi === definition.star) {
          shootingStar = note;
        }
      }
    }
  }
  const drums = [
    shootingStar && ([shootingStar, "star"] as const),
    ...claps.map((note) => [note, "clap"] as const),
    ...kicks.map((note) => [note, "kick"] as const),
    ...snares.map((note) => [note, "snare"] as const),
    ...hihats.map((note) => [note, "hihat"] as const),
    ...openHihats.map((note) => [note, "openHihat"] as const),
  ]
    .filter((drum) => drum !== undefined)
    .toSorted((a, b) => a[0].ticks - b[0].ticks);

  for (const [note, noteType] of drums) {
    if (note.ticks > currentTick) {
      continue;
    }

    const noteTimeSignature = midi.header.timeSignatures.findLast(
      (v) => v.ticks <= note.ticks,
    )!;
    const beats =
      (noteTimeSignature.timeSignature[0] /
        noteTimeSignature.timeSignature[1]) *
      8;
    const measure = midi.header.ticksToMeasures(note.ticks);
    const measureDivision =
      Math.floor((measure % 1) * beats + 0.00001) + (8 - beats);
    let sixteenthType: "none" | "left" | "right" = "none";
    if (Math.floor((measure % 1) * beats * 2 + 0.00001) % 2 === 1) {
      sixteenthType = "right";
    } else if (
      drums.some(
        ([drum]) =>
          drum.ticks > note.ticks &&
          drum.ticks <= note.ticks + midi.header.ppq / 4,
      )
    ) {
      sixteenthType = "left";
    }
    const x =
      baseX -
      cymbalWidthPadded -
      cymbalSeparatorWidth -
      cellSectionSize +
      measureDivision * cellWidth +
      measureDivision * cellPadding +
      dotUnit;
    let y = baseY - cellHeight;
    let alpha = 255;
    if (measure < Math.floor(currentMeasure)) {
      const progress = Math.min((currentMeasure % 1) / 0.5, 1);
      const eased = easeOutQuint(progress);
      y +=
        shiftHeight * eased +
        shiftHeight * (Math.floor(currentMeasure) - Math.floor(measure) - 1);
      alpha =
        Math.floor(currentMeasure) - Math.floor(measure) === 1
          ? 64 * (1 - eased) + 128
          : 128;
    }
    const progress = Math.min((currentMeasure - measure) * 16, 1);
    let saturation = 1 - alpha / 255;
    if (sixteenthType !== "none") {
      saturation += 0.5;
      saturation = Math.min(saturation, 1);
    }
    graphics.fill(
      255 - (255 - color[0]) * saturation,
      255 - (255 - color[1]) * saturation,
      255 - (255 - color[2]) * saturation,
      alpha * progress,
    );
    if (noteType === "star") {
      const height = cellHeight - dotUnit * 7;
      graphics.rect(
        x + dotUnit * 5,
        y + dotUnit * 2 + height * (1 - progress),
        cellWidth - dotUnit * 10,
        height * progress,
      );
      graphics.rect(
        x + dotUnit * 5,
        y + cellHeight - dotUnit * 4,
        cellWidth - dotUnit * 10,
        dotUnit * 2,
      );
      continue;
    }
    switch (noteType) {
      case "kick": {
        if (snares.some((snare) => snare.ticks === note.ticks)) {
          continue;
        }
        if (claps.some((clap) => clap.ticks === note.ticks)) {
          continue;
        }
        const height = cellHeight - dotUnit * 4;

        if (shootingStar?.ticks === note.ticks) {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2 + height * (1 - progress),
            dotUnit * 2,
            height * progress,
          );
          graphics.rect(
            x + cellWidth - dotUnit * 4,
            y + dotUnit * 2 + height * (1 - progress),
            dotUnit * 2,
            height * progress,
          );
        } else {
          if (sixteenthType === "none" || sixteenthType === "left") {
            graphics.rect(
              x + dotUnit * 2,
              y + dotUnit * 2 + height * (1 - progress),
              (cellWidth - dotUnit * 4) / 2,
              height * progress,
            );
          }
          if (sixteenthType === "none" || sixteenthType === "right") {
            graphics.rect(
              x + cellWidth / 2,
              y + dotUnit * 2 + height * (1 - progress),
              (cellWidth - dotUnit * 4) / 2,
              height * progress,
            );
          }
        }
        break;
      }
      case "snare": {
        if (shootingStar?.ticks === note.ticks) {
          continue;
        }
        const width = cellWidth - dotUnit * 4;
        if (kicks.some((kick) => kick.ticks === note.ticks)) {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + (width / 2) * (1 - progress),
            y + dotUnit * 2 + (cellHeight - dotUnit * 6) / 3 + dotUnit,
            (width / 2) * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + width / 2,
            y + dotUnit * 2 + (cellHeight - dotUnit * 6) / 3 + dotUnit,
            (width / 2) * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
          graphics.rect(
            x + dotUnit * 2 + width * (1 - progress),
            y +
              dotUnit * 2 +
              (cellHeight - dotUnit * 6) * (2 / 3) +
              dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 6) / 3,
          );
        } else {
          graphics.rect(
            x + dotUnit * 2,
            y + dotUnit * 2,
            width * progress,
            (cellHeight - dotUnit * 5) / 2,
          );
          graphics.rect(
            x + dotUnit * 2 + width * (1 - progress),
            y + dotUnit * 2 + (cellHeight - dotUnit * 5) / 2 + dotUnit,
            width * progress,
            (cellHeight - dotUnit * 5) / 2,
          );
        }
        break;
      }
      case "clap": {
        const height = cellHeight - dotUnit * 4;
        graphics.rect(
          x + dotUnit * 2,
          y + dotUnit * 2,
          (cellWidth - dotUnit * 5) / 2,
          height * progress,
        );
        graphics.rect(
          x + dotUnit * 2 + (cellWidth - dotUnit * 5) / 2 + dotUnit,
          y + dotUnit * 2 + height * (1 - progress),
          (cellWidth - dotUnit * 5) / 2,
          height * progress,
        );
        break;
      }
      case "hihat": {
        if (openHihats.some((openHihat) => openHihat.ticks === note.ticks)) {
          continue;
        }
        if (sixteenthType === "none" || sixteenthType === "left") {
          graphics.rect(x, y, cellWidth / 2, dotUnit);
          graphics.rect(x, y + cellHeight - dotUnit, cellWidth / 2, dotUnit);
          graphics.rect(x, y, dotUnit, cellHeight);
        }
        if (sixteenthType === "none" || sixteenthType === "right") {
          graphics.rect(x + cellWidth / 2, y, cellWidth / 2, dotUnit);
          graphics.rect(
            x + cellWidth / 2,
            y + cellHeight - dotUnit,
            cellWidth / 2,
            dotUnit,
          );
          graphics.rect(x + cellWidth - dotUnit, y, dotUnit, cellHeight);
        }
        break;
      }
      case "openHihat": {
        const partWidth = (cellWidth - dotUnit) / 2;
        const partHeight = (cellHeight - dotUnit) / 2;
        if (sixteenthType === "none" || sixteenthType === "left") {
          graphics.rect(x, y, partWidth * progress, dotUnit);
          graphics.rect(x, y, dotUnit, partHeight * progress);
          graphics.rect(
            x,
            y + cellHeight - partHeight * progress,
            dotUnit,
            partHeight * progress,
          );
          graphics.rect(
            x,
            y + cellHeight - dotUnit,
            partWidth * progress,
            dotUnit,
          );
        }
        if (sixteenthType === "none" || sixteenthType === "right") {
          graphics.rect(
            x + cellWidth - partWidth * progress,
            y,
            partWidth * progress,
            dotUnit,
          );
          graphics.rect(
            x + cellWidth - dotUnit,
            y,
            dotUnit,
            partHeight * progress,
          );
          graphics.rect(
            x + cellWidth - partWidth,
            y + cellHeight - dotUnit,
            partWidth * progress,
            dotUnit,
          );
          graphics.rect(
            x + cellWidth - dotUnit,
            y + cellHeight - partHeight,
            dotUnit,
            partHeight * progress,
          );
        }

        break;
      }
    }
  }
};
