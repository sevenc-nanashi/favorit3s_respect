import type p5 from "p5";
import { dotUnit, height, sliceDefinitions } from "../const";
import { timelineMid } from "../midi";
import type { State } from "../state";
import textureUrl from "../assets/textures/0.png";
import { useGraphicContext } from "../utils";
const syachiTrack = timelineMid.tracks.find(
  (track) => track.name === "frame_syachi",
)!;
let texture: p5.Image;

const preload = (p: p5) => {
  texture = p.loadImage(textureUrl);
};

const syachiStart = syachiTrack.notes[0].ticks;
const syachiEnd =
  syachiTrack.notes[syachiTrack.notes.length - 1].ticks +
  syachiTrack.notes[syachiTrack.notes.length - 1].durationTicks;

const syachiSlice = sliceDefinitions.syachi;

export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!texture) {
    preload(p);
    return;
  }
  using _context = useGraphicContext(p);

  if (state.currentTick < syachiStart) {
    return;
  }
  if (state.currentTick > syachiEnd) {
    return;
  }

  const syachiStartMeasure = timelineMid.header.ticksToMeasures(syachiStart);
  const syachiEndMeasure = timelineMid.header.ticksToMeasures(syachiEnd);
  const quantize = 16;
  const quantizedMeasure =
    Math.floor(state.currentMeasure * quantize) / quantize;
  const progress = p.map(
    quantizedMeasure,
    syachiStartMeasure,
    syachiEndMeasure,
    0,
    1,
  );

  const x = p.width * progress * 0.75;
  const udToggle = Math.floor(quantizedMeasure * 4) % 2;
  for (const lr of [-1, 1]) {
    using _context = useGraphicContext(p);
    if (lr === -1) {
      p.scale(-1, 1);
      p.translate(-p.width, dotUnit * 32);
    }
    for (let i = 0; i > -16; i--) {
      using _context = useGraphicContext(p);
      p.translate(x, 0);
      p.scale(dotUnit);
      p.translate(
        (syachiSlice.width + dotUnit * 4) * i,
        dotUnit * (i % 2 === 0 ? 2 : 0),
      );
      p.translate(0, udToggle * (i % 2 === 0 ? 1 : -1));
      p.scale(-1, 1);
      p.image(
        texture,
        0,
        0,
        syachiSlice.width,
        syachiSlice.height,
        syachiSlice.start[0],
        syachiSlice.start[1],
        syachiSlice.width,
        syachiSlice.height,
      );
    }
  }
});
