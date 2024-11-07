import type p5 from "p5";
import type { State } from "../state";
import commonVert from "../shaders/common.vert?raw";
import pixelizeFrag from "../shaders/pixelize.frag?raw";
import timelineMidRaw from "../assets/timeline.mid?uint8array";
import { parseMidi } from "midi-file";
import { dotUnit, frameRate } from "../const";
import { getCurrentMeasure, getCurrentTick, midi, timelineMid } from "../midi";
import type { Note } from "@tonejs/midi/dist/Note";
import { sort } from "pixelsort";
import { easeInQuint, easeOutQuint } from "../easing";

const imageSwitchMid = 60;
const pixelsortInMid = 61;
const pixelsortOutMid = 62;
const alphaInMid = 63;

const timelineLowMid = parseMidi(timelineMidRaw);
const backgroundTrack = timelineLowMid.tracks.find((track) =>
  track.some(
    (note) => note.type === "trackName" && note.text === "backgrounds",
  ),
)!;
const backgroundTonejsMid = timelineMid.tracks.find(
  (track) => track.name === "backgrounds",
)!;
const backgroundEvents = backgroundTrack.reduce(
  (acc, note) => {
    acc.time += note.deltaTime;
    if (note.type !== "text") {
      return acc;
    }
    const textBytes = note.text.split("").map((char) => char.charCodeAt(0));
    const text = new TextDecoder()
      .decode(new Uint8Array(textBytes))
      .replaceAll("/", "\n");
    const midiNote = backgroundTonejsMid.notes.find(
      (note) => note.ticks === acc.time && note.midi === imageSwitchMid,
    );
    if (!midiNote) {
      throw new Error(`No note found for lyrics at ${acc.time}, ${text}`);
    }
    acc.lyrics.push({ text, time: acc.time, note: midiNote });
    return acc;
  },
  { lyrics: [] as { text: string; time: number; note: Note }[], time: 0 },
);

const images = import.meta.glob("../assets/backgrounds/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const loadedImages: Record<string, p5.Image> = {};
let pixelizeShader: p5.Shader;
let cpuGraphics: p5.Graphics;
let mainGraphics: p5.Graphics;

const wave = dotUnit;
const minusScale = 1 / 8;

export const preload = import.meta.hmrify((p: p5) => {
  for (const [path, image] of Object.entries(images)) {
    const filename = path.split("/").pop()!;
    loadedImages[filename] = p.loadImage(image.default);
  }
});

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (Object.keys(loadedImages).length === 0) {
    preload(p);
    return;
  }
  if (!pixelizeShader) {
    pixelizeShader = p.createShader(commonVert, pixelizeFrag);
  }
  if (!mainGraphics) {
    cpuGraphics = p.createGraphics(p.width * minusScale, p.height * minusScale);
    mainGraphics = p.createGraphics(
      p.width * minusScale,
      p.height * minusScale,
      p.WEBGL,
    );

    mainGraphics.shader(pixelizeShader);
  }

  mainGraphics.clear();
  const currentTick = getCurrentTick(state);
  const activeBackground = backgroundEvents.lyrics.find(
    (note) =>
      note.time <= currentTick &&
      note.time + note.note.durationTicks > currentTick,
  );

  const sortNote = backgroundTonejsMid.notes.find(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      (note.midi === pixelsortInMid || note.midi === pixelsortOutMid),
  );

  if (activeBackground) {
    cpuGraphics.clear();
    cpuGraphics.image(
      loadedImages[activeBackground.text],
      0,
      0,
      cpuGraphics.width,
      cpuGraphics.height,
    );
    if (sortNote) {
      cpuGraphics.loadPixels();
      cpuGraphics.noSmooth();
      const sortNoteProgress = Math.min(
        1,
        (currentTick - sortNote.ticks) / sortNote.durationTicks,
      );
      const sorted = sort(
        cpuGraphics.pixels as unknown as Uint8Array,
        cpuGraphics.width,
        cpuGraphics.height,
        512 *
          (sortNote.midi === pixelsortInMid
            ? easeInQuint(sortNoteProgress)
            : easeInQuint(1 - sortNoteProgress)),
      );
      for (let i = 0; i < sorted.length; i++) {
        cpuGraphics.pixels[i] = sorted[i];
      }
      cpuGraphics.updatePixels(0, 0, cpuGraphics.width, cpuGraphics.height);
    }
    pixelizeShader.setUniform("u_resolution", [
      p.width * minusScale,
      p.height * minusScale,
    ]);

    const currentMeasure = getCurrentMeasure(state);
    pixelizeShader.setUniform(
      "u_wave",
      Math.sin(currentMeasure * Math.PI) * wave * minusScale,
    );
    pixelizeShader.setUniform("u_pixelSize", dotUnit * 4 * minusScale);
    pixelizeShader.setUniform("u_texture", cpuGraphics);

    mainGraphics.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  }

  const alphaNote = backgroundTonejsMid.notes.find(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      note.midi === alphaInMid,
  );
  const alphaProgress = alphaNote
    ? Math.min(1, (currentTick - alphaNote.ticks) / alphaNote.durationTicks)
    : 1;
  p.tint(255, 192 * easeOutQuint(alphaProgress));
  p.image(mainGraphics, 0, 0, p.width, p.height);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    mainGraphics?.remove();
  });
}
