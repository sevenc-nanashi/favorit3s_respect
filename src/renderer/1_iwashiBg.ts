import type p5 from "p5";
import type { State } from "../state";
import commonVert from "../shaders/common.vert?raw";
import pixelizeFrag from "../shaders/pixelize.frag?raw";
import { dotUnit } from "../const";
import { timelineMid } from "../midi";

const shouldShowMid = 72;
const moveMid = 73;

const backgroundTrack = timelineMid.tracks.find(
  (track) => track.name === "backgrounds",
)!;

const images = import.meta.glob("../assets/iwashi/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const loadedImages: Record<string, p5.Image> = {};

export const preload = import.meta.hmrify((p: p5) => {
  for (const [path, image] of Object.entries(images)) {
    const filename = path.split("/").pop()!;
    loadedImages[filename] = p.loadImage(image.default);
  }
});

const baseY = 182;
const fenceWidth = 80;
const floorBaseY = 239;
const floorWidth = 64;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (Object.keys(loadedImages).length === 0) {
    preload(p);
    return;
  }

  const currentTick = state.currentTick;
  const isActive = backgroundTrack.notes.some(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      note.midi === shouldShowMid,
  );
  if (!isActive) {
    return;
  }
  const move = backgroundTrack.notes.some(
    (note) =>
      note.ticks <= currentTick &&
      note.ticks + note.durationTicks > currentTick &&
      note.midi === moveMid,
  );
  p.scale(dotUnit);
  const shift = move ? (state.currentMeasure * 2) % 1 : 0;
  for (let i = -1; i < 8; i++) {
    p.image(loadedImages["fence.png"], (i - shift) * fenceWidth, baseY);
  }
  for (let i = -1; i < 8; i++) {
    p.image(loadedImages["floor.png"], (i + shift) * floorWidth, floorBaseY);
  }
});
