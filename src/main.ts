import p5 from "p5";
import "./style.css";
import { frameRate, height, width } from "./const.ts";
import { draw, preload } from "./draw.ts";
import { State } from "./state.ts";
import { attachCapturerUi } from "p5-frame-capturer";

new p5((p: p5) => {
  const state = new State(0, false);
  p.preload = () => {
    preload(p);
  };
  p.setup = () => {
    p.frameRate(frameRate);
    p.createCanvas(width, height);
    p.noSmooth();
  };

  p.draw = () => {
    draw(p, state);
  };

  attachCapturerUi(p);
});
