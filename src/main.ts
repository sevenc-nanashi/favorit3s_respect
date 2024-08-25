import p5 from "p5";
import { registerP5Capture } from "p5.capture";
import "./style.css";
import { draw } from "./draw.ts";
import { width, height, frameRate } from "./const.ts";
import type { State } from "./state.ts";

const instance = new p5((p: p5) => {
	const state: State = {
		currentFrame: 0,
		playing: false,
	};
	p.setup = () => {
		p.frameRate(frameRate);
		p.createCanvas(width, height);
	};

	p.draw = () => {
		draw(p, state);
	};
});

registerP5Capture(instance);
