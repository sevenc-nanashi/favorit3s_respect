import type p5 from "p5";
import type { State } from "../state";
import { timelineMid } from "../midi";
import { dotUnit } from "../const";

const track = timelineMid.tracks.find((track) => track.name === "misc")!;

const drawFrame = (
  p: p5,
  progress: number,
  x: number,
  y: number,
  size: number,
  weight: number,
) => {
  p.beginShape();
  const vertices: [number, number][] = [];
  const backVertices: [number, number][] = [];
  const absProgress = Math.abs(progress);
  (() => {
    if (progress > 0) {
      vertices.push([x, y]);
      backVertices.push([x, y - weight]);
      if (absProgress <= 1 / 8) {
        vertices.push([x + p.lerp(0, size / 2, absProgress / (1 / 8)), y]);
        backVertices.push([
          x + p.lerp(0, size / 2 + weight, absProgress / (1 / 8)),
          y - weight,
        ]);
        return;
      }
      vertices.push([x + size / 2, y]);
      backVertices.push([x + size / 2 + weight, y - weight]);
      if (absProgress <= 3 / 8) {
        vertices.push([
          x + size / 2,
          y + p.lerp(0, size, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x + size / 2 + weight,
          y +
            p.lerp(-weight, size + weight * 2, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        return;
      }

      vertices.push([x + size / 2, y + size]);
      backVertices.push([x + size / 2 + weight, y + size + weight]);

      if (absProgress <= 5 / 8) {
        vertices.push([
          x + p.lerp(size / 2, -size / 2, (absProgress - 3 / 8) / (2 / 8)),
          y + size,
        ]);
        backVertices.push([
          x +
            p.lerp(
              size / 2 + weight,
              -size / 2 - weight,
              (absProgress - 3 / 8) / (2 / 8),
            ),
          y + size + weight,
        ]);
        return;
      }
      vertices.push([x - size / 2, y + size]);
      backVertices.push([x - size / 2 - weight, y + size + weight]);

      if (absProgress <= 7 / 8) {
        vertices.push([
          x - size / 2,
          y + p.lerp(size, 0, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x - size / 2 - weight,
          y + p.lerp(size + weight, -weight, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        return;
      }

      vertices.push([x - size / 2, y]);
      backVertices.push([x - size / 2 - weight, y - weight]);

      vertices.push([
        x + p.lerp(-size / 2, 0, (absProgress - 7 / 8) / (1 / 8)),
        y,
      ]);
      backVertices.push([
        x + p.lerp(-size / 2 - weight, 0, (absProgress - 7 / 8) / (1 / 8)),
        y - weight,
      ]);
    } else {
      vertices.push([x, y]);
      backVertices.push([x, y - weight]);
      if (absProgress >= 7 / 8) {
        vertices.push([
          x - p.lerp(size / 2, 0, (absProgress - 7 / 8) / (1 / 8)),
          y,
        ]);
        backVertices.push([
          x - p.lerp(size / 2 + weight, 0, (absProgress - 7 / 8) / (1 / 8)),
          y - weight,
        ]);
        return;
      }
      vertices.push([x - size / 2, y]);
      backVertices.push([x - size / 2 - weight, y - weight]);
      if (absProgress >= 5 / 8) {
        vertices.push([
          x - size / 2,
          y + p.lerp(size, 0, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x - size / 2 - weight,
          y + p.lerp(size + weight, -weight, (absProgress - 5 / 8) / (2 / 8)),
        ]);
        return;
      }
      vertices.push([x - size / 2, y + size]);
      backVertices.push([x - size / 2 - weight, y + size + weight]);
      if (absProgress >= 3 / 8) {
        vertices.push([
          x + p.lerp(size / 2, -size / 2, (absProgress - 3 / 8) / (2 / 8)),
          y + size,
        ]);
        backVertices.push([
          x +
            p.lerp(
              size / 2 + weight,
              -size / 2 - weight,
              (absProgress - 3 / 8) / (2 / 8),
            ),
          y + size + weight,
        ]);
        return;
      }
      vertices.push([x + size / 2, y + size]);
      backVertices.push([x + size / 2 + weight, y + size + weight]);
      if (absProgress >= 1 / 8) {
        vertices.push([
          x + size / 2,
          y + p.lerp(0, size, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        backVertices.push([
          x + size / 2 + weight,
          y + p.lerp(-weight, size + weight, (absProgress - 1 / 8) / (2 / 8)),
        ]);
        return;
      }
      vertices.push([x + size / 2, y]);
      backVertices.push([x + size / 2 + weight, y - weight]);
      vertices.push([x + p.lerp(0, size / 2, absProgress / (1 / 8)), y]);
      backVertices.push([
        x + p.lerp(0, size / 2 + weight, absProgress / (1 / 8)),
        y - weight,
      ]);
    }
  })();
  for (const [vx, vy] of vertices) {
    p.vertex(vx, vy);
  }
  for (const [vx, vy] of backVertices.toReversed()) {
    p.vertex(vx, vy);
  }

  p.endShape(p.CLOSE);
};

const innerSize = 300;
const outerSize = 400;
const innerFrameMidi = 72;
const innerFrameOutMidi = 73;
const outerFrameMidi = 74;
const outerFramePersistMidi = 75;
export const draw = import.meta.hmrify((p: p5, state: State) => {
  p.noStroke();
  p.fill(255);

  const innerFrame = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === innerFrameMidi,
  );
  if (innerFrame) {
    const progress = p.map(
      state.currentTick,
      innerFrame.ticks,
      innerFrame.ticks + innerFrame.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      progress,
      p.width / 2,
      p.height / 2 - innerSize / 2,
      innerSize,
      dotUnit * 2,
    );
  }

  const innerFrameOut = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === innerFrameOutMidi,
  );
  if (innerFrameOut) {
    const progress = p.map(
      state.currentTick,
      innerFrameOut.ticks,
      innerFrameOut.ticks + innerFrameOut.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      -progress,
      p.width / 2,
      p.height / 2 - innerSize / 2,
      innerSize,
      dotUnit * 2,
    );
  }

  const outerFrame = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === outerFrameMidi,
  );
  if (outerFrame) {
    const progress = p.map(
      state.currentTick,
      outerFrame.ticks,
      outerFrame.ticks + outerFrame.durationTicks,
      0,
      1,
      true,
    );
    drawFrame(
      p,
      progress,
      p.width / 2,
      p.height / 2 - outerSize / 2,
      outerSize,
      dotUnit * 2,
    );
  }
  const outerFramePersist = track.notes.findLast(
    (note) =>
      state.currentTick >= note.ticks &&
      state.currentTick < note.ticks + note.durationTicks &&
      note.midi === outerFramePersistMidi,
  );
  if (outerFramePersist) {
    drawFrame(
      p,
      1,
      p.width / 2,
      p.height / 2 - outerSize / 2,
      outerSize,
      dotUnit * 2,
    );
  }
});
