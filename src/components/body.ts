import type p5 from "p5";
import { characterLabs } from "../lab.ts";
import type { State } from "../state.ts";
import { sliceDefinitions, slices } from "../const";
import { timelineMid } from "../midi.ts";

const textureInfos = [
  { mouth: "closed", eyes: "open" },
  { mouth: "o", eyes: "closed" },
  { mouth: "i", eyes: null },
  { mouth: "e", eyes: null },
  { mouth: "u", eyes: null },
  { mouth: "a", eyes: null },
] as const satisfies {
  mouth: string;
  eyes: string | null;
}[];

const faceTrack = timelineMid.tracks.find((track) => track.name === "face")!;
const characters = ["aoi", "defoko", "zundamon", "tsumugi", "teto", "akane"];
const faceBaseMid = 56;
const faceMidPerCharacter = 2;

export const drawItem = (
  p: p5,
  state: State,
  textureImages: Record<string, p5.Image>,
  itemName: string,
  yShift: number,
) => {
  const slice = sliceDefinitions[itemName];
  if (!slice) {
    throw new Error(`No slice found for ${itemName}`);
  }
  p.image(
    textureImages["1.png"],
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
    textureImages["1.png"],
    -slice.width / 2,
    -slice.height + yShift,
    slice.width,
    slice.moveHeight + 1,
    slice.start[0],
    slice.start[1],
    slice.width,
    slice.moveHeight + 1,
  );
  if (characters.includes(itemName)) {
    const index = characters.indexOf(itemName);
    const faceNotes = faceTrack.notes.filter(
      (note) =>
        note.ticks <= state.currentTick &&
        note.ticks + note.durationTicks >= state.currentTick &&
        note.midi >= faceBaseMid + index * faceMidPerCharacter &&
        note.midi < faceBaseMid + (index + 1) * faceMidPerCharacter,
    );
    const openEyes = !faceNotes.some((note) => note.midi % 2 === 0);
    let mouthType = "closed";
    if (itemName in characterLabs) {
      const lab = characterLabs[itemName as keyof typeof characterLabs];
      const currentPhoneme = lab.find(
        (phoneme) =>
          phoneme.start <= state.currentTime && state.currentTime < phoneme.end,
      );
      if (currentPhoneme) {
        switch (currentPhoneme.phoneme) {
          case "a":
          case "u":
          case "o":
          case "i":
          case "e":
            mouthType = currentPhoneme.phoneme;
            break;
          default:
            mouthType = "closed";
            break;
        }
      }
    }
    const toggleMouth = faceNotes.some((note) => note.midi % 2 === 1);
    if (toggleMouth) {
      mouthType = "o";
    }
    p.image(
      textureImages[
        `${textureInfos.findIndex(
          (info) => info.eyes === (openEyes ? "open" : "closed"),
        )}.png`
      ],
      -slice.width / 2,
      -slice.height + (slices.eyeY - slice.start[1]) + yShift,
      slice.width,
      slices.mouthY - slices.eyeY,
      slice.start[0],
      slices.eyeY,
      slice.width,
      slices.mouthY - slices.eyeY,
    );
    p.image(
      textureImages[
        `${textureInfos.findIndex((info) => info.mouth === mouthType)}.png`
      ],
      -slice.width / 2,
      -slice.height + (slices.mouthY - slice.start[1]) + yShift,
      slice.width,
      slices.mouthHeight + 1,
      slice.start[0],
      slices.mouthY,
      slice.width,
      slices.mouthHeight + 1,
    );
  }
};
