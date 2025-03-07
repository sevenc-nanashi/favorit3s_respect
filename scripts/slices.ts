import fs from "node:fs/promises";
import jsYaml from "js-yaml";
import sharp from "sharp";
import canvas, { ImageData, loadImage } from "@napi-rs/canvas";

const assets = `${import.meta.dirname}/../src/assets`;

const output = `${import.meta.dirname}/../src/assets/slices.yml`;
const sliceDefinition = `${assets}/textures/atlas.png`;

const sliceDefinitionImage = sharp(sliceDefinition).raw();
const sliceDefinitionMetadata = await sliceDefinitionImage.metadata();
const sliceDefinitionBuffer = await sliceDefinitionImage.toBuffer();

const findPixels = (r: number, g: number, b: number, a: number) =>
  sliceDefinitionBuffer.reduce(
    (acc, _pixel, index) => {
      if (index % 4 !== 0) {
        return acc;
      }

      const x = (index / 4) % sliceDefinitionMetadata.width!;
      const y = Math.floor(index / 4 / sliceDefinitionMetadata.width!);

      const red = sliceDefinitionBuffer[index];
      const green = sliceDefinitionBuffer[index + 1];
      const blue = sliceDefinitionBuffer[index + 2];
      const alpha = sliceDefinitionBuffer[index + 3];

      if (red === r && green === g && blue === b && alpha === a) {
        acc.push([x, y]);
      }

      return acc;
    },
    [] as [number, number][],
  );

const redPixels = findPixels(255, 0, 0, 255);
const yellowPixels = findPixels(255, 255, 0, 255);
const greenPixels = findPixels(0, 255, 0, 255);
if (redPixels.length !== greenPixels.length) {
  throw new Error(
    `Invalid slice definition: pixels count mismatch, red: ${redPixels.length}, yellow: ${yellowPixels.length}, green: ${greenPixels.length}`,
  );
}

type SliceDefinition = {
  name: string;
  start: [number, number];
  width: number;
  moveHeight: number;
  height: number;
  end: [number, number];
};

type SlicesYml = {
  slices: SliceDefinition[];
  eyeY: number;
  mouthY: number;
  mouthHeight: number;
};

const existingSliceDefinition: SlicesYml = await fs
  .readFile(output, "utf-8")
  // biome-ignore lint/suspicious/noExplicitAny: 面倒
  .then((content) => jsYaml.load(content) as any)
  // biome-ignore lint/suspicious/noExplicitAny: 面倒
  .catch(() => ({ slices: [] }) as any);

const slices: SliceDefinition[] = redPixels
  .toSorted(([x1, y1], [x2, y2]) => {
    const rightBottomDistance1 =
      Math.abs(x1 - sliceDefinitionMetadata.width!) +
      Math.abs(y1 - sliceDefinitionMetadata.height!);
    const rightBottomDistance2 =
      Math.abs(x2 - sliceDefinitionMetadata.width!) +
      Math.abs(y2 - sliceDefinitionMetadata.height!);
    return rightBottomDistance1 - rightBottomDistance2;
  })
  .map(([x, y], index) => {
    const start = [x, y] as [number, number];
    const nearestGreenPixelIndex = greenPixels.reduce(
      (acc, [greenX, greenY], greenIndex) => {
        if (greenX < x || greenY < y) {
          return acc;
        }
        const distance = Math.abs(greenX - x) + Math.abs(greenY - y);

        return distance < acc.distance ? { index: greenIndex, distance } : acc;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    ).index;

    const greenPixel = greenPixels.splice(nearestGreenPixelIndex, 1)[0];

    const nearestYellowPixelIndex = yellowPixels.reduce(
      (acc, [yellowX, yellowY], yellowIndex) => {
        if (
          yellowX < x ||
          yellowY < y ||
          yellowX !== greenPixel[0] ||
          yellowY > greenPixel[1]
        ) {
          return acc;
        }
        const distance = Math.abs(yellowX - x) + Math.abs(yellowY - y);

        return distance < acc.distance ? { index: yellowIndex, distance } : acc;
      },
      { index: -1, distance: Number.POSITIVE_INFINITY },
    ).index;

    const yellowPixel =
      nearestYellowPixelIndex === -1
        ? undefined
        : yellowPixels.splice(nearestYellowPixelIndex, 1)[0];

    const moveHeight = yellowPixel ? yellowPixel[1] - start[1] : 0;
    const end = greenPixel;

    const existingSlice = existingSliceDefinition.slices.find(
      (slice) =>
        slice.start[0] === start[0] &&
        slice.start[1] === start[1] &&
        slice.moveHeight === moveHeight &&
        slice.end[0] === end[0] &&
        slice.end[1] === end[1],
    );

    return {
      name: existingSlice?.name ?? `slice-${index}`,
      start,
      width: end[0] - start[0] + 1,
      moveHeight,
      height: end[1] - start[1] + 1,
      end,
    };
  });

slices.reverse();

const cyanPixels = findPixels(0, 255, 255, 255);
const bluePixels = findPixels(0, 0, 255, 255);
const purplePixels = findPixels(255, 0, 255, 255);

const eyeY = cyanPixels[0][1];
const mouthY = bluePixels[0][1];
const mouthEndY = purplePixels[0][1];

await fs.writeFile(
  output,
  jsYaml.dump(
    {
      slices,
      eyeY,
      mouthY,
      mouthHeight: mouthEndY - mouthY,
    } satisfies SlicesYml,
    {
      noRefs: true,
    },
  ),
);

const canvasElement = canvas.createCanvas(
  sliceDefinitionMetadata.width!,
  sliceDefinitionMetadata.height!,
);
const context = canvasElement.getContext("2d");
if (!context) {
  throw new Error("Failed to get context");
}

const zeroRaw = await fs.readFile(`${assets}/textures/0.png`);
const zeroImage = await loadImage(zeroRaw);
context.drawImage(zeroImage, 0, 0);
for (const [index, slice] of slices.entries()) {
  context.strokeStyle = `hsl(${(index / slices.length) * 360}, 100%, 50%)`;
  context.strokeRect(slice.start[0], slice.start[1], slice.width, slice.height);
  if (slice.moveHeight) {
    context.strokeRect(
      slice.start[0],
      slice.start[1],
      slice.width,
      slice.moveHeight,
    );
  }
  context.fillText(slice.name, slice.start[0], slice.start[1]);
}

await fs.writeFile(
  `${import.meta.dirname}/../src/assets/slices.png`,
  canvasElement.toBuffer("image/png"),
);
