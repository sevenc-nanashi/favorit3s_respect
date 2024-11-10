import matter from "matter-js";
import chars from "./chars.png";
import charsText from "./chars.txt?raw";
import matterAttractors from "matter-attractors";
matter.use(matterAttractors);
const image = new Image();
image.src = chars;
await new Promise((resolve) => {
  image.onload = resolve;
});

const canvas = document.createElement("canvas");
canvas.width = image.width;
canvas.height = image.height;
const context = canvas.getContext("2d")!;
context.drawImage(image, 0, 0);

const data = context.getImageData(0, 0, image.width, image.height);
const alpha = data.data.filter((_, i) => i % 4 === 3);

const engine = matter.Engine.create();
engine.gravity.y = 0.5;

// create a renderer
const render = matter.Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 1920,
    height: 1080,
    wireframes: false,
  },
});

const imageGridUnit = 8;
const size = 36 / imageGridUnit;

const topPadding = 48 + 36 * 2;
const sidePadding = 24 * 2 + 36 * 2;
const rowWidth = 36 * 1.2;
const leftTexts = [[], [1, 2], [], [5, 6], [7], [10, 11]];
const rightTexts = [[0], [], [3, 4], [], [7], [8, 9]];

const absLowClamp = (value: number, min: number) => {
  return Math.abs(value) < min ? Math.sign(value) * min : value;
};
const absHighClamp = (value: number, max: number) => {
  return Math.abs(value) > max ? Math.sign(value) * max : value;
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const shiftedBodies = [] as number[];
const shiftChars = ["、", "。"];
const smallBodies = [] as number[];
const smallChars = ["、", "。", "っ", "ゃ", "ゅ", "ょ"];

const attracts = [
  (bodyA: matter.Body, bodyB: matter.Body) => {
    if (bodyA.isStatic || bodyB.isStatic) return;
    if (bodyA.position.y <= 0 || bodyB.position.y <= 0) return;
    const dx = bodyA.position.x - bodyB.position.x;
    const dy = bodyA.position.y - bodyB.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const isEitherSmall =
      smallBodies.includes(bodyA.id) || smallBodies.includes(bodyB.id);

    const maxDistance = isEitherSmall ? 10 : 38;
    const unitVector = matter.Vector.normalise({ x: dx, y: dy });
    const forceUnclamped = matter.Vector.mult(
      unitVector,
      clamp(
        (1 / absLowClamp(distance, 1)) *
          (1 - Math.min(distance / maxDistance, 1)) ** 3.2,
        0,
        1,
      ),
    );
    const force = {
      x: absHighClamp(forceUnclamped.x * 2, 2),
      y: absHighClamp(forceUnclamped.y, 2),
    };
    if (!Number.isFinite(force.x) || !Number.isFinite(force.y)) return;

    // apply force to both bodies
    matter.Body.applyForce(bodyA, bodyA.position, force);
    matter.Body.applyForce(bodyB, bodyB.position, matter.Vector.neg(force));
  },
];

const bodyInfo = new Map<
  number,
  { char: string; center: matter.Vector; side: "left" | "right" }
>();
for (let cy = 0; cy < image.height; cy += imageGridUnit) {
  for (let cx = 0; cx < image.width; cx += imageGridUnit) {
    const bodies = [];
    const bodies2 = [];
    const char = charsText.split("\n")[cy / imageGridUnit][cx / imageGridUnit];

    let xShift = 0;
    let yShift = 0;
    if (shiftChars.includes(char)) {
      xShift = (size * imageGridUnit) / 2 + size;
      yShift = (-size * imageGridUnit) / 2;
    }
    for (let x = 0; x < imageGridUnit; x++) {
      for (let y = 0; y < imageGridUnit; y++) {
        const index = cx + x + (cy + y) * image.width;
        if (alpha[index] === 0) continue;
        const body = matter.Bodies.rectangle(
          x * size + xShift,
          y * size + yShift,
          size,
          size,
          {
            render: {
              fillStyle: "white",
            },
          },
        );
        bodies.push(body);

        const body2 = matter.Bodies.rectangle(
          x * size + xShift,
          y * size + yShift,
          size,
          size,
          {
            render: {
              fillStyle: "white",
            },
          },
        );
        bodies2.push(body2);
      }
    }
    if (bodies.length === 0) continue;
    const leftRowIndex = leftTexts.findIndex((v) =>
      v.includes(cy / imageGridUnit),
    );
    const rightRowIndex = rightTexts.findIndex((v) =>
      v.includes(cy / imageGridUnit),
    );

    if (leftRowIndex !== -1) {
      const body = matter.Body.create({
        parts: bodies,
        restitution: 0,
        plugin: {
          attractors: attracts,
        },
      });
      const center = structuredClone(body.position);
      const inRowIndex = leftTexts[leftRowIndex].indexOf(cy / imageGridUnit);
      matter.Body.translate(body, {
        x:
          sidePadding +
          rowWidth * (leftTexts[leftRowIndex].length - inRowIndex - 1),
        y:
          cx * size + 1080 * (leftRowIndex - leftTexts.length + 1) + topPadding,
      });
      if (shiftChars.includes(char)) {
        shiftedBodies.push(body.id);
      }
      if (smallChars.includes(char)) {
        smallBodies.push(body.id);
      }
      bodyInfo.set(body.id, { char, center, side: "left" });
      matter.World.add(engine.world, body);
    }
    if (rightRowIndex !== -1) {
      const body = matter.Body.create({
        parts: bodies2,
        restitution: 0,
        plugin: {
          attractors: attracts,
        },
      });
      const inRowIndex = rightTexts[rightRowIndex].indexOf(cy / imageGridUnit);
      const center = structuredClone(body.position);
      matter.Body.translate(body, {
        x: 1920 - sidePadding - rowWidth * inRowIndex - size * imageGridUnit,
        y:
          cx * size +
          1080 * (rightRowIndex - rightTexts.length + 1) +
          topPadding,
      });
      if (shiftChars.includes(char)) {
        shiftedBodies.push(body.id);
      }
      if (smallChars.includes(char)) {
        smallBodies.push(body.id);
      }
      bodyInfo.set(body.id, { char, center, side: "right" });
      matter.World.add(engine.world, body);
    }
  }
}
const groundHeight = 128;
const ground = matter.Bodies.rectangle(
  1920 / 2,
  1080 + groundHeight / 2 - 124,
  1920 - 48,
  groundHeight,
  {
    isStatic: true,
  },
);
const limitMaxSpeed = () => {
  const maxSpeed = 15;
  const maxUpSpeed = 5;
  for (const body of engine.world.bodies) {
    if (body.velocity.x > maxSpeed) {
      matter.Body.setVelocity(body, { x: maxSpeed, y: body.velocity.y });
    }

    if (body.velocity.x < -maxSpeed) {
      matter.Body.setVelocity(body, { x: -maxSpeed, y: body.velocity.y });
    }

    if (body.velocity.y > maxSpeed) {
      matter.Body.setVelocity(body, { x: body.velocity.x, y: maxSpeed });
    }

    if (body.velocity.y < -maxUpSpeed) {
      matter.Body.setVelocity(body, { x: -body.velocity.x, y: -maxUpSpeed });
    }
  }
};
matter.Events.on(engine, "beforeUpdate", limitMaxSpeed);
// add all of the bodies to the world
matter.Composite.add(engine.world, [ground]);

// create runner
const runner = matter.Runner.create();

if (location.search.includes("bake")) {
  const seconds = 20;
  const result = [];
  for (let i = 0; i < 60 * seconds; i++) {
    const frame = [];
    matter.Engine.update(engine, 1000 / 60);
    for (const body of engine.world.bodies) {
      const info = bodyInfo.get(body.id);
      if (!info) continue;
      frame.push({
        x: body.position.x,
        y: body.position.y,
        angle: body.angle,
        ...info,
      });
    }
    result.push(frame);
  }
  await fetch("http://localhost:8080/save", {
    method: "POST",
    body: JSON.stringify(result),
    mode: "no-cors",
  });

  location.search = "";
} else {
  matter.Render.run(render);
  // run the Engine
  matter.Runner.run(runner, engine);
}
