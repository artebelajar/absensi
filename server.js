import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

serve({
    fetch: app.fetch,
    port: 4000,
});