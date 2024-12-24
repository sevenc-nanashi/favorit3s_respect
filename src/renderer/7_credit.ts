import type p5 from "p5";
import creditsRaw from "../assets/credits.txt?raw";
import { fg, mainFont } from "../const";
import { timelineMid } from "../midi";
import type { State } from "../state";
import { sidePadding, topPadding } from "./7_lyrics";

const credits = creditsRaw
  .split("====\n")
  .map((credit) => credit.split("----\n"));

const creditTrack = timelineMid.tracks.find(
  (track) => track.name === "credit",
)!;

let graphics: p5.Graphics;
export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!graphics) {
    graphics = p.createGraphics(p.width, p.height);
  }
  graphics.clear();

  graphics.textSize(24);
  graphics.textFont(mainFont);
  graphics.fill(...fg);
  graphics.textAlign(p.LEFT, p.TOP);

  const activeCredit = creditTrack.notes.find(
    (note) =>
      note.ticks <= state.currentTick &&
      state.currentTick < note.ticks + note.durationTicks,
  );
  if (!activeCredit) return;

  const currentCreditSections = credits[activeCredit.midi - 60];
  if (!currentCreditSections) return;
  const innerWidth = p.width - sidePadding;

  for (const [i, credit] of currentCreditSections.entries()) {
    const baseX = (innerWidth / currentCreditSections.length) * i + sidePadding;

    for (const [j, line] of credit.split("\n").entries()) {
      const y = topPadding + j * 28;
      let x = baseX;
      const fragments = line.matchAll(/([^()ǂ]+)([()ǂ]|$)/g);
      for (const fragment of fragments) {
        const text = fragment[1];
        graphics.text(text, x, y);
        x += graphics.textWidth(text);
        if ("()".includes(fragment[2])) {
          graphics.text(fragment[2], x, y - 2);
          x += graphics.textWidth(fragment[2]);
        } else if (fragment[2] === "ǂ") {
          graphics.fill(...fg);
          graphics.noStroke();
          graphics.rect(x, y + 4, 12, 3);
          graphics.rect(x, y + 12, 12, 3);
          graphics.rect(x + 4.5, y, 3, 21);
          x += 15;
        }
      }
    }
  }

  p.image(graphics, 0, 0);
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graphics.remove();
  });
}
