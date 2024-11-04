import type p5 from "p5";
import type { State } from "../state";
import { getCurrentTick } from "../midi";
import { dotUnit, engFont, fg, frameRate, mainFont } from "../const";
import { beatVisualizer } from "../components/beatVisualizer";
import songsRaw from "../assets/songs.txt?raw";
import songsMidRaw from "../assets/songs.mid?uint8array";
import { Midi } from "@tonejs/midi";
import {
  drumVisualizer,
  drumVisualizerHeight,
} from "../components/drumVisualizer";
import { easeOutQuint } from "../easing";
import { parseMidi } from "midi-file";
import { Note } from "@tonejs/midi/dist/Note";

const songs = songsRaw.split("\n");
const songsMid = parseMidi(songsMidRaw);
const songsTonejsMid = new Midi(songsMidRaw);
const lyricsTrack = songsMid.tracks.find((track) =>
  track.some((note) => note.type === "trackName" && note.text === "lyrics"),
)!;
const lyricsTonejsMid = songsTonejsMid.tracks.find(
  (track) => track.name === "lyrics",
)!;
const lyrics = lyricsTrack.reduce(
  (acc, note) => {
    acc.time += note.deltaTime;
    if (note.type !== "text") {
      return acc;
    }
    const textBytes = note.text.split("").map((char) => char.charCodeAt(0));
    const text = new TextDecoder()
      .decode(new Uint8Array(textBytes))
      .replaceAll("/", "\n");
    const midiNote = lyricsTonejsMid.notes.find(
      (note) => note.ticks === acc.time,
    );
    if (!midiNote) {
      throw new Error(`No note found for lyrics at ${acc.time}, ${text}`);
    }
    acc.lyrics.push({ text, time: acc.time, note: midiNote });
    return acc;
  },
  { lyrics: [] as { text: string; time: number; note: Note }[], time: 0 },
);

const shiftChars = ["、", "。"];
const replacementChars = {
  ー: "｜",
} as Record<string, string>;
const bracketChars = ["「", "」", "『", "』", "（", "）", "〈", "〉"];

const groupLeftLyrics = () => {
  const result = [];
  const leftLyrics = lyrics.lyrics.filter(
    (lyric) => lyric.text.startsWith("z:") || lyric.text.startsWith("b:"),
  );
  const events = [] as { type: "start" | "end"; time: number; lines: number }[];
  for (const lyric of leftLyrics) {
    events.push({
      type: "start",
      time: lyric.note.ticks,
      lines: lyric.text.split("\n").length,
    });
    events.push({
      type: "end",
      time: lyric.note.ticks + lyric.note.durationTicks,
      lines: lyric.text.split("\n").length,
    });
  }
  events.sort((a, b) => {
    if (a.time === b.time) {
      return a.type === "start" ? 1 : -1;
    }
    return a.time - b.time;
  });
  let current = 0;
  let currentStart = 0;
  let max = 0;
  for (const event of events) {
    if (event.type === "start") {
      if (current === 0) {
        currentStart = event.time;
      }
      current += event.lines;
      max = Math.max(max, current);
    } else {
      current -= event.lines;
      if (current === 0) {
        result.push({ start: currentStart, end: event.time, max });
        max = 0;
      }
    }
  }

  return result;
};
const leftLyricsGroups = groupLeftLyrics();

const verticalText = (
  graphics: p5.Graphics,
  text: string,
  startX: number,
  startY: number,
  lineHeight = 0,
) => {
  let x = startX;
  let y = startY;
  const actualLineHeight = lineHeight || graphics.textSize();
  for (const char of text) {
    if (char === " ") {
      y += graphics.textSize();
      continue;
    }
    if (char === "\n") {
      x -= actualLineHeight;
      y = startY;
      continue;
    }
    graphics.push();
    if (bracketChars.includes(char)) {
      graphics.rotate(Math.PI / 2);
      graphics.textAlign(graphics.LEFT, graphics.CENTER);
      graphics.text(char, y, -x + graphics.textSize() / 6);
    } else if (shiftChars.includes(char)) {
      graphics.textAlign(graphics.CENTER, graphics.TOP);
      graphics.text(
        char,
        x + graphics.textSize() / 2,
        y - graphics.textSize() / 2,
      );
    } else {
      graphics.textAlign(graphics.CENTER, graphics.TOP);
      graphics.text(replacementChars[char] ?? char, x, y);
    }
    y += graphics.textSize();
    graphics.pop();
  }
};

const sidePadding = 24 + 36 * 2;
const topPadding = 48 + 36 * 2;
let rightGraphics: p5.Graphics;
let leftGraphics: p5.Graphics;

const borderRadius = 4;

const fontSize = 36;
const lineHeight = fontSize * 1.2;
const graphicsWidth = lineHeight * 5;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!rightGraphics) {
    rightGraphics = p.createGraphics(graphicsWidth, p.height);
  }
  if (!leftGraphics) {
    leftGraphics = p.createGraphics(graphicsWidth, p.height);
  }
  rightGraphics.clear();
  leftGraphics.clear();

  rightGraphics.textSize(fontSize);
  rightGraphics.textFont(mainFont);
  rightGraphics.fill(...fg);

  leftGraphics.textSize(fontSize);
  leftGraphics.textFont(mainFont);
  leftGraphics.fill(...fg);

  const currentTick = getCurrentTick(state);
  const activeLyrics = lyrics.lyrics
    .filter(
      (lyric) =>
        lyric.time <= currentTick &&
        currentTick < lyric.time + lyric.note.durationTicks,
    )
    .toSorted((a, b) => a.note.midi - b.note.midi);

  const leftLyrics = activeLyrics
    .filter(
      (lyric) => lyric.text.startsWith("z:") || lyric.text.startsWith("b:"),
    )
    .map((lyric) => lyric.text.slice(2));
  const rightLyrics = activeLyrics
    .filter(
      (lyric) => lyric.text.startsWith("t:") || lyric.text.startsWith("b:"),
    )
    .map((lyric) => lyric.text.slice(2));

  verticalText(
    rightGraphics,
    rightLyrics.join("\n"),
    rightGraphics.width - lineHeight,
    topPadding,
    lineHeight,
  );
  if (leftLyrics.length !== 0) {
    const leftLyricsGroup = leftLyricsGroups.find(
      (group) => group.start <= currentTick && currentTick < group.end,
    )!;
    verticalText(
      leftGraphics,
      leftLyrics.join("\n"),
      lineHeight * leftLyricsGroup.max,
      topPadding,
      lineHeight,
    );
  }

  const leftBaseX = sidePadding;
  const rightBaseX = p.width - sidePadding - rightGraphics.width;
  for (let shiftX = -1; shiftX <= 1; shiftX++) {
    for (let shiftY = -1; shiftY <= 1; shiftY++) {
      p.tint(64, 128, 64, 255);
      p.image(
        leftGraphics,
        leftBaseX + borderRadius * shiftX,
        borderRadius * shiftY,
      );
      p.tint(128, 128, 64, 255);
      p.image(
        rightGraphics,
        rightBaseX + borderRadius * shiftX,
        borderRadius * shiftY,
      );
    }
  }
  p.tint(255, 255);
  p.image(leftGraphics, leftBaseX, 0);
  p.image(rightGraphics, rightBaseX, 0);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    leftGraphics?.remove();
    rightGraphics?.remove();
  });
}
