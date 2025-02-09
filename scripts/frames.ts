import agPsd from "ag-psd";
import "ag-psd/initialize-canvas";
import * as fs from "node:fs/promises";
import { createCanvas } from "@napi-rs/canvas";
import child_process from "node:child_process";

const result = await fs.readFile(process.argv[2]);
const psdFile = agPsd.readPsd(new Uint8Array(result.buffer));

const frames = new Set<number>();
const frameLayers: agPsd.Layer[] = [];

const findFrames = (layer: agPsd.Layer) => {
  if (layer.name?.startsWith("#")) {
    frames.add(Number.parseInt(layer.name.slice(1)));
    frameLayers.push(layer);
  }
  if (layer.children) {
    for (const child of layer.children) {
      findFrames(child);
    }
  }
};

findFrames(psdFile);

const canvas = createCanvas(psdFile.width, psdFile.height);
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Failed to get 2d context");
}

const atlas = psdFile.children?.find((layer) => layer.name === "atlas");
if (!atlas) {
  throw new Error("atlas not found");
}
// @ts-expect-error 動く
ctx.drawImage(atlas.canvas, atlas.left, atlas.top);
const image = canvas.toBuffer("image/png");
await fs.writeFile(`${process.argv[3]}/atlas.png`, image);

atlas.hidden = true;

for (const frame of frames) {
  for (const layer of frameLayers) {
    layer.hidden = !layer.name?.startsWith(`#${frame}`);
  }

  ctx.clearRect(0, 0, psdFile.width, psdFile.height);

  const path = `${process.argv[3]}/${frame - 1}.psd`;
  const buffer = agPsd.writePsd(psdFile);
  await fs.writeFile(path, new Uint8Array(buffer));
}
