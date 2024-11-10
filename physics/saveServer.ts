import { Hono } from "hono";
import { serve } from "@hono/node-server";
import fs from "node:fs/promises";

const app = new Hono();

app.post("/save", async (c) => {
  const body = await c.req.json();
  await fs.writeFile(
    `${import.meta.dirname}/../src/assets/gravity.json`,
    JSON.stringify(body, null, 2),
  );
  console.log("Saved gravity.json");


  return c.json({ status: "ok" });
});

serve({
  port: 8080,
  fetch: app.fetch,
});
