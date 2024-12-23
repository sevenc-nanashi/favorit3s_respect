import fs from "node:fs/promises";
import { GlobalFonts, createCanvas } from "@napi-rs/canvas";
import midi from "@tonejs/midi";
import { parseMidi } from "midi-file";
const { Midi } = midi;

const assets = `${import.meta.dirname}/../src/assets`;
const timelineMidRaw = await fs.readFile(`${assets}/timeline.mid`);
const timelineMid = new Midi(timelineMidRaw);
const timelineLowMid = parseMidi(timelineMidRaw);
const lyricsTrack = timelineLowMid.tracks.find((track) =>
  track.some((note) => note.type === "trackName" && note.text === "lyrics"),
)!;
const lyricsTonejsMid = timelineMid.tracks.find(
  (track) => track.name === "lyrics",
)!;
const lyrics = lyricsTrack.reduce(
  (acc, note) => {
    acc.time += note.deltaTime;
    if (note.type !== "text") {
      return acc;
    }
    const tonejsNote = lyricsTonejsMid.notes.find(
      (note) => note.ticks === acc.time,
    );
    if (!tonejsNote) {
      throw new Error(`No note found for lyrics at ${acc.time}`);
    }
    if (
      lyricsTonejsMid.notes.find(
        (note) =>
          tonejsNote.ticks + tonejsNote.durationTicks === note.ticks &&
          note.midi === tonejsNote.midi,
      )
    ) {
      return acc;
    }
    const textBytes = note.text.split("").map((char) => char.charCodeAt(0));
    const text = new TextDecoder()
      .decode(new Uint8Array(textBytes))
      .replaceAll("/", "\n");
    acc.lyrics.push(text.replace(/[zbt]:/, ""));
    return acc;
  },
  { lyrics: [] as string[], time: 0 },
);
GlobalFonts.registerFromPath(`${assets}/misaki_gothic.ttf`, "MisakiGothic");

const lastFallingText = lyrics.lyrics.findIndex(
  (lyrics) => lyrics === "湿って砕けました。",
);
if (lastFallingText === -1) {
  throw new Error("No falling text found");
}
const fallingTexts = lyrics.lyrics.slice(0, lastFallingText + 1);
const maxChars = Math.max(...fallingTexts.map((text) => text.length));

const fontSize = 8;
const canvas = createCanvas(
  maxChars * fontSize,
  fallingTexts.length * fontSize,
);
const ctx = canvas.getContext("2d");
ctx.font = `${fontSize}px MisakiGothic`;
for (const [i, fallingText] of fallingTexts.entries()) {
  for (const [j, char] of fallingText.split("").entries()) {
    const width = ctx.measureText(char).width;
    ctx.fillText(
      char,
      j * fontSize + fontSize / 2 - width / 2,
      i * fontSize + fontSize * (7 / 8),
    );
  }
}
const data = await canvas.encode("png");
await fs.writeFile(`${import.meta.dirname}/chars.png`, data);
await fs.writeFile(`${import.meta.dirname}/chars.txt`, fallingTexts.join("\n"));
console.log("chars.png and chars.txt generated");
console.log(`- ${fallingTexts.join("\n - ")}`);
