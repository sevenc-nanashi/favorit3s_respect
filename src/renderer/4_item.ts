import type p5 from "p5";
import { dotUnit } from "../const";
import { loadTimelineWithText } from "../midi";
import type { State } from "../state";
import { useGraphicContext } from "../utils";
import { groundHeight } from "./5_physics";
import { drawItem } from "../components/body";

/*    mouth  | eyes
 * 1: closed | open
 * 2: o      | closed
 * 3: a      | null
 * 4: u      | null
 * 5: e      | null
 * 6: i      | null
 */

const textures = import.meta.glob("../assets/textures/*.png", {
  eager: true,
}) as Record<string, { default: string }>;

const track = loadTimelineWithText("item");
const textureImages: Record<string, p5.Image> = {};
export const preload = import.meta.hmrify((p: p5) => {
  for (const [path, image] of Object.entries(textures)) {
    const filename = path.split("/").pop()!;
    textureImages[filename] = p.loadImage(image.default);
  }
});

const imageSpecification =
  /(?<place>[-0-9.]+):(?<name>[a-z]+):(?<base>[0-9]+)/g;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (Object.keys(textureImages).length === 0) {
    preload(p);
    return;
  }

  const scale = dotUnit;
  const lastImageSpecification = track.texts.findLast(
    (note) => state.currentTick >= note.note.ticks,
  );
  if (!lastImageSpecification) {
    return;
  }
  const imageSpecificationMatch = Array.from(
    lastImageSpecification.text.matchAll(imageSpecification),
  );
  for (const match of imageSpecificationMatch) {
    using _context = useGraphicContext(p);
    const place = Number.parseFloat(match.groups!.place);
    p.translate(p.width / 2 + 200 * place, p.height - groundHeight);
    p.scale(scale);

    const base = Number.parseInt(match.groups!.base);
    const activeNote = track.track.notes.findLast(
      (note) =>
        note.ticks <= state.currentTick &&
        note.ticks + note.durationTicks >= state.currentTick &&
        note.midi <= base &&
        note.midi + 11 >= base,
    );
    if (!activeNote) {
      continue;
    }
    const shiftValue = base - activeNote.midi;

    drawItem(p, state, textureImages, match.groups!.name, shiftValue);
  }
});
