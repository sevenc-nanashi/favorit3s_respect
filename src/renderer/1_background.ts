import type p5 from "p5";
import type { State } from "../state";
import commonVert from "../shaders/common.vert?raw";
import pixelizeFrag from "../shaders/pixelize.frag?raw";
import timelineMidRaw from "../assets/timeline.mid?uint8array";
import { parseMidi } from "midi-file";
import { dotUnit } from "../const";
import { getCurrentTick, timelineMid } from "../midi";
import type { Note } from "@tonejs/midi/dist/Note";

const timelineLowMid = parseMidi(timelineMidRaw);
const lyricsTrack = timelineLowMid.tracks.find((track) =>
  track.some(
    (note) => note.type === "trackName" && note.text === "backgrounds",
  ),
)!;
const lyricsTonejsMid = timelineMid.tracks.find((track) => track.name === "backgrounds")!;
const backgroundEvents = lyricsTrack.reduce(
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

const images = import.meta.glob("../assets/backgrounds/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const loadedImages: Record<string, p5.Image> = {};
let pixelizeShader: p5.Shader;
let mainGraphics: p5.Graphics;

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
    mainGraphics = p.createGraphics(p.width, p.height, p.WEBGL);

    mainGraphics.shader(pixelizeShader);
  }

  mainGraphics.clear();
  const currentTick = getCurrentTick(state);
  const activeBackground = backgroundEvents.lyrics.find(
    (note) =>
      note.time <= currentTick &&
      note.time + note.note.durationTicks > currentTick,
  );

  if (activeBackground) {
    pixelizeShader.setUniform("u_resolution", [p.width, p.height]);
    pixelizeShader.setUniform("u_pixelSize", dotUnit * 4);
    pixelizeShader.setUniform("u_texture", loadedImages[activeBackground.text]);
    mainGraphics.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  }

  p.tint(255, 192);
  p.image(mainGraphics, 0, 0);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    mainGraphics?.remove();
  });
}
