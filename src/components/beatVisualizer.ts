import type p5 from "p5";
import { getCurrentMeasure, getCurrentTick, midi } from "../midi";
import type { State } from "../state";
import { dotUnit, smallFont } from "../const";

export const beatVisualizer = import.meta.hmrify(
  (graphics: p5.Graphics, state: State, x: number, y: number) => {
    const measure = getCurrentMeasure(state);
    const currentTimeSignature = midi.header.timeSignatures.findLast(
      (v) => v.ticks <= getCurrentTick(state),
    )!;
    const beats =
      (currentTimeSignature.timeSignature[0] /
        currentTimeSignature.timeSignature[1]) *
      4;

    const measureFraction = (measure * beats) % 1;
    const measureBeats = measureFraction * 8;

    let index = -1;

    for (let j = 1; j >= 0; j--) {
      for (let i = 0; i < 4; i++) {
        let brightness = 128;
        index += 1;
        brightness = measureBeats > index ? 255 : 128;

        graphics.fill(brightness);
        graphics.noStroke();
        graphics.rect(
          x - dotUnit * 4 * j + dotUnit * 4,
          y - dotUnit * 2 * i - dotUnit * 7,
          dotUnit * 3,
          dotUnit,
        );
      }
    }

    graphics.textFont(smallFont);
    graphics.textSize(dotUnit * 6);
    graphics.fill(255);
    graphics.textAlign(graphics.CENTER, graphics.BOTTOM);
    graphics.text(
      `${Math.floor((measure * beats) % beats) + 1}`,
      x + dotUnit * 2,
      y + dotUnit * 1.5,
    );
    graphics.text(
      `${Math.floor(measureBeats) + 1}`,
      x + dotUnit * 6,
      y + dotUnit * 1.5,
    );
  },
);
