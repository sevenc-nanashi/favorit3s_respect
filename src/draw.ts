import type p5 from "p5";
import audio from "./assets/main.wav?url";
import { bg, frameRate, mainFont } from "./const.ts";
import { startCapturer, stopCapturer, state as captureState } from "p5-frame-capturer";
import type { State } from "./state.ts";
import { useGraphicContext } from "./utils.ts";

const renderers = import.meta.glob("./renderer/*.ts", {
  eager: true,
}) as Record<
  string,
  { draw: (p: p5, state: State) => void; preload?: (p: p5) => void }
>;
const audioElement = new Audio(audio);
audioElement.autoplay = false;
audioElement.volume = 0.5;

let registeredCallback: ((e: KeyboardEvent) => void) | null = null;
let prevMain: p5.Graphics;
let main: p5.Graphics;
let lastFrameErrored = false;
export const preload = import.meta.hmrify((p: p5) => {
  for (const { preload } of Object.values(renderers)) {
    if (preload) {
      preload(p);
    }
  }
  audioElement.load();
});
export const draw = import.meta.hmrify((p: p5, state: State) => {
  if (!audioElement.paused && !state.playing) {
    audioElement.pause();
  }
  if (audioElement.paused && state.playing && !captureState.isCapturing) {
    audioElement.play();
    audioElement.currentTime = state.currentFrame / frameRate;
  }
  try {
    if (!registeredCallback) {
      registeredCallback = keydown(p, state);
      window.addEventListener(
        "keydown",
        registeredCallback as (e: KeyboardEvent) => void,
      );
    }

    if (captureState.isCapturing) {
      state.currentFrame = captureState.frameCount;
      if (state.currentFrame >= frameRate * (audioElement.duration + 5)) {
        stopCapturer();
      }
    } else {
      state.currentFrame = Math.floor(audioElement.currentTime * frameRate) + 2;
    }
    p.background(...bg);
    p.noSmooth();

    for (const [path, { draw }] of Object.entries(renderers)) {
      using _context = useGraphicContext(p);
      draw(p, state);
    }

    lastFrameErrored = false;
  } catch (e) {
    p.push();
    p.background([255, 0, 0, 250]);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.fill([255, 255, 255]);
    p.textFont(mainFont);
    p.text(String(e), 32, 32);
    p.pop();
    if (!lastFrameErrored) {
      console.error(e);
    }
    lastFrameErrored = true;
  }
});

const keydown = (p: p5, state: State) => (e: KeyboardEvent) => {
  if (e.key === " ") {
    state.playing = !state.playing;
  }
  if (e.key === "s") {
    if (state.currentFrame !== 2) {
      location.reload();
      return;
    }

    startCapturer(p);
  }
  if (e.key === "r") {
    state.currentFrame = 0;
    audioElement.currentTime = 0;
  }
  if (e.key === "ArrowRight") {
    audioElement.currentTime += 5;
  }
  if (e.key === "ArrowLeft") {
    audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
  }
  if (e.key === "ArrowUp") {
    audioElement.volume += 0.1;
  }
  if (e.key === "ArrowDown") {
    audioElement.volume -= 0.1;
  }
};

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (registeredCallback)
      window.removeEventListener("keydown", registeredCallback);

    audioElement.pause();
    prevMain.remove();
    main.remove();
  });
}
