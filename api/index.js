import { Hono } from "hono";

import {auth} from "./auth.js";
import admin from "./admin.js";
import user from "./user.js";

const app = new Hono();

app.route("/auth", auth)
app.route("/admin", admin)
app.route("/user", user)

export default app;