import { serve } from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";

import app from "./api/index.js";

app.use("/*", serveStatic({ root: "./public" }))

serve({
    fetch: app.fetch,
    port: 4040,
});

console.log("Server berjalan di http://localhost:4040");