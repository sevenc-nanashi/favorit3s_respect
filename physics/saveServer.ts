import fs from "node:fs/promises";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.post("/save", async (c) => {
  const body = await c.req.json();
  await fs.writeFile(
    `${import.meta.dirname}/../src/assets/gravity.temp.json`,
    JSON.stringify(body),
  );
  await fs.rename(
    `${import.meta.dirname}/../src/assets/gravity.temp.json`,
    `${import.meta.dirname}/../src/assets/gravity.json`,
  );
  console.log("Saved gravity.json");

  return c.json({ status: "ok" });
});

serve({
  port: 8080,
  fetch: app.fetch,
});
