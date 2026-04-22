import { Hono } from "hono";
import { serve } from "@hono/node-server";
import auth from "./api/auth.js";
import admin from "./api/admin.js";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));
app.route("/auth", auth)
app.route("/admin", admin)


serve({
    fetch: app.fetch,
    port: 4000,
});