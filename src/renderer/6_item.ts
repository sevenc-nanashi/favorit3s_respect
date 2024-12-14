import type p5 from "p5";
import type { State } from "../state";
import { loadTimelineWithText, timelineMid } from "../midi";
import { dotUnit } from "../const";
import texture from "../assets/texture.png";
import face1 from "../assets/face1.png";
import face2 from "../assets/face2.png";
import slicesRaw from "../assets/slices.yml";
import { groundHeight } from "./5_physics";
import { useGraphicContext } from "../utils";
import { characterLabs } from "../lab";

// face1: eyes=close, mouth=open
// face2: eyes=open, mouth=close

type SliceDefinition = {
  name: string;
  start: [number, number];
  width: number;
  moveHeight: number;
  height: number;
  end: [number, number];
};
const slices = slicesRaw as {
  slices: SliceDefinition[];
  eyeY: number;
  mouthY: number;
  mouthHeight: number;
};
const sliceDefinitions = Object.fromEntries(
  slices.slices.map((slice: SliceDefinition) => [slice.name, slice]),
) as Record<string, SliceDefinition>;

const track = loadTimelineWithText("item");
const faceTrack = timelineMid.tracks.find((track) => track.name === "face")!;
const characters = ["aoi", "defoko", "zundamon", "tsumugi", "teto", "akane"];
const faceBaseMid = 56;
const faceMidPerCharacter = 2;

let textureImage: p5.Image;
let face1Image: p5.Image;
let face2Image: p5.Image;
export const preload = import.meta.hmrify((p: p5) => {
  textureImage = p.loadImage(texture);
  face1Image = p.loadImage(face1);
  face2Image = p.loadImage(face2);
});

const imageSpecification =
  /(?<place>[-0-9.]+):(?<name>[a-z]+):(?<base>[0-9]+)/g;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!textureImage) {
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
    const slice = sliceDefinitions[match.groups!.name];
    if (!slice) {
      throw new Error(`No slice found for ${match.groups!.name}`);
    }
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

    p.image(
      textureImage,
      -slice.width / 2,
      -slice.height + slice.moveHeight,
      slice.width,
      slice.height - slice.moveHeight,
      slice.start[0],
      slice.start[1] + slice.moveHeight,
      slice.width,
      slice.height - slice.moveHeight,
    );
    p.image(
      textureImage,
      -slice.width / 2,
      -slice.height + shiftValue,
      slice.width,
      slice.moveHeight,
      slice.start[0],
      slice.start[1],
      slice.width,
      slice.moveHeight,
    );
    if (characters.includes(match.groups!.name)) {
      const index = characters.indexOf(match.groups!.name);
      const faceNotes = faceTrack.notes.filter(
        (note) =>
          note.ticks <= state.currentTick &&
          note.ticks + note.durationTicks >= state.currentTick &&
          note.midi >= faceBaseMid + index * faceMidPerCharacter &&
          note.midi < faceBaseMid + (index + 1) * faceMidPerCharacter,
      );
      const toggleEyes = faceNotes.some((note) => note.midi % 2 === 0);
      let isMouthOpenByLab = false;
      if (match.groups!.name in characterLabs) {
        const lab =
          characterLabs[match.groups!.name as keyof typeof characterLabs];
        const currentPhoneme = lab.find(
          (phoneme) =>
            phoneme.start <= state.currentTime &&
            state.currentTime < phoneme.end,
        );
        if (currentPhoneme) {
          isMouthOpenByLab = "aeo".includes(currentPhoneme.phoneme);
        }
      }
      const toggleMouth =
        faceNotes.some((note) => note.midi % 2 === 1) || isMouthOpenByLab;
      p.image(
        toggleEyes ? face2Image : face1Image,
        -slice.width / 2,
        -slice.height + (slices.eyeY - slice.start[1]) + shiftValue,
        slice.width,
        slices.mouthY - slices.eyeY,
        slice.start[0],
        slices.eyeY,
        slice.width,
        slices.mouthY - slices.eyeY,
      );
      p.image(
        toggleMouth ? face2Image : face1Image,
        -slice.width / 2,
        -slice.height + (slices.mouthY - slice.start[1]) + shiftValue,
        slice.width,
        slices.mouthHeight,
        slice.start[0],
        slices.mouthY,
        slice.width,
        slices.mouthHeight,
      );
    }
  }
});
