import parse from "reaper-project-parser";
import fs from "node:fs/promises";
import jsYaml from "js-yaml";
import { split } from "shlex";

const rpp = await fs.readFile(process.argv[2], "utf-8");
// @ts-expect-error reaper-project-parserのエクスポートがおかしい
const project = (parse.default as typeof parse)({
  projectRawText: rpp,
});

const unwrapString = (value: string) => {
  if (value.startsWith('"')) return value.slice(1, -1);
  return value;
};

type Vst = {
  type: "vst";
  name: string;
};
type Container = {
  type: "container";
  children: Vst[];
};
type Fx = Vst | Container;

const getFxs = (fx: ReturnType<typeof parse>["children"]) => {
  const fxs: Fx[] = [];
  for (const fxChild of fx) {
    if (fxChild.key === "VST") {
      const rawValue = fxChild.tagValue.rawValue;
      const fxName = split(rawValue)[0];
      fxs.push({
        type: "vst",
        name: fxName.replaceAll(/.+: /g, ""),
      });
    } else if (fxChild.key === "CONTAINER") {
      fxs.push({
        type: "container",
        children: getFxs(fxChild.children) as Vst[],
      });
    }
  }
  return fxs;
};

type Instrument = {
  name: string;
  fxs: (string | string[])[];
};
const instruments: Instrument[] = [];
const folderStack: string[] = [];
for (const children of project.children) {
  if (children.key !== "TRACK") {
    continue;
  }
  const isBus = children.values.find((child) => child.key === "ISBUS");
  if (!isBus) {
    continue;
  }
  const isBusValue = split(isBus.rawValue).map((n) => Number.parseInt(n));
  const name = children.values.find((child) => child.key === "NAME")!;
  if (isBusValue[0] === 1) {
    folderStack.push(unwrapString(name.rawValue));
  }
  if (isBusValue[0] === 2) {
    for (let i = 0; i < -isBusValue[1]; i++) {
      folderStack.pop();
    }
  }

  const fxChain = children.children.find((child) => child.key === "FXCHAIN")!;
  if (!fxChain) {
    continue;
  }
  const fxs = getFxs(fxChain.children);

  instruments.push({
    name: [...folderStack, unwrapString(name.rawValue)].join(" / "),
    fxs: fxs.map((fx) => {
      if (fx.type === "vst") {
        return fx.name;
      }
      return fx.children.map((child) => {
        if (child.type === "vst") {
          return child.name;
        }
        return "container";
      });
    }),
  });
}

await fs.writeFile(
  process.argv[3],
  jsYaml.dump(instruments, { lineWidth: 120 }),
);
