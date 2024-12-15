const rawLabs = import.meta.glob("./assets/lab/*.lab", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

type LabEntry = {
  start: number;
  end: number;
  phoneme: string;
};
export const characterLabs = {
  teto: [] as LabEntry[],
  zundamon: [] as LabEntry[],
  tsumugi: [] as LabEntry[],
  aoi: [] as LabEntry[],
  akane: [] as LabEntry[],
  defoko: [] as LabEntry[],
};

for (const [path, lab] of Object.entries(rawLabs)) {
  const lines = lab.split("\n");
  const characterBase = path.split("/").pop()!.split(".")[0];
  const character = characterBase
    .split("_")
    .at(-1) as keyof typeof characterLabs;
  const startAt = 45000000 / 10e7;
  for (const [i, line] of lines.entries()) {
    const [start, end, phoneme] = line.split(" ");
    if (i <= 3) {
      continue;
    }
    if (phoneme === "pau") {
      continue;
    }
    characterLabs[character].push({
      start: Number.parseInt(start) / 10e7 - startAt,
      end: Number.parseInt(end) / 10e7 - startAt,
      phoneme,
    });
  }
}

for (const character of Object.keys(
  characterLabs,
) as (keyof typeof characterLabs)[]) {
  characterLabs[character].sort((a, b) => a.start - b.start);
}
