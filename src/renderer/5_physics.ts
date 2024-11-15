import type p5 from "p5";
import type { State } from "../state";
import { timelineMid } from "../midi";
import { dotUnit, fg, mainFont } from "../const";
import bakedGravityRaw from "../assets/gravity.json";
import { padding } from "./4_info";
import { easeOutQuint } from "../easing";
import { useGraphicContext } from "../utils";

type GravityInfo = {
  x: number;
  y: number;
  angle: number;
  char: string;
  side: "left" | "right";
  center: { x: number; y: number };
};
const bakedGravity = bakedGravityRaw as GravityInfo[][];

const gravityTrack = timelineMid.tracks.find(
  (track) => track.name === "misc",
)!;
const gravityMidi = 60;
const shiftMidi = 61;

const shiftChars = ["、", "。"];

const doDraw = (
  p: p5,
  info: GravityInfo,
  groundShift: number,
  xShift: number,
  yShift: number,
) => {
  using _context = useGraphicContext(p);
  p.rotate(info.angle);
  let centerX = info.center.x - 36 / 2 + xShift;
  let centerY = info.center.y + yShift;
  if (shiftChars.includes(info.char)) {
    centerX -= 36 / 2 + 36 / 6;
    centerY += 36 / 2;
  }
  const x =
    info.x - Math.cos(info.angle) * centerX + Math.sin(info.angle) * centerY;
  const y =
    info.y -
    Math.sin(info.angle) * centerX -
    Math.cos(info.angle) * centerY -
    groundShift;

  const angleRad = info.angle;
  const shiftedX = Math.cos(angleRad) * x + Math.sin(angleRad) * y;
  const shiftedY = -Math.sin(angleRad) * x + Math.cos(angleRad) * y;
  p.text(info.char, shiftedX, shiftedY);
};
export const draw = import.meta.hmrify((p: p5, state: State) => {
  const gravity = gravityTrack.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === gravityMidi,
  );

  const shift = gravityTrack.notes.find((note) => note.midi === shiftMidi)!;

  const shiftProgress = p.map(
    state.currentTick,
    shift.ticks,
    shift.ticks + shift.durationTicks,
    0,
    1,
    true,
  );
  if (shiftProgress === 1) return;
  const groundShift = 360 * shiftProgress;
  const initialProgress = p.map(state.currentMeasure, 0.5, 2, 0, 1, true);
  p.noStroke();
  p.fill(...fg);
  p.rect(
    padding,
    p.height - padding - 24 * 3 - padding - dotUnit - groundShift,
    (p.width - padding * 2) * easeOutQuint(initialProgress),
    dotUnit,
  );
  if (gravity) {
    const elapsed = state.currentTime - gravity.time;
    const gravityInfo = bakedGravity[Math.floor(elapsed * 60)];
    if (!gravityInfo) return;

    p.textFont(mainFont);
    p.textSize(36);
    p.textAlign(p.CENTER, p.TOP);
    // for (const info of gravityInfo) {
    //   if (info.y < groundShift) continue;
    //   if (info.y > p.height + groundShift) continue;
    //   for (let sx = -1; sx <= 1; sx++) {
    //     for (let sy = -1; sy <= 1; sy++) {
    //       if (info.side === "left") {
    //         p.fill(64, 128, 64);
    //       } else {
    //         p.fill(128, 128, 64);
    //       }
    //       doDraw(p, info, groundShift, sx * 4, sy * 4);
    //     }
    //   }
    // }
    for (const info of gravityInfo) {
      if (info.y < groundShift) continue;
      if (info.y > p.height + groundShift) continue;
      p.fill(...fg);
      doDraw(p, info, groundShift, 0, 0);
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {});
}
