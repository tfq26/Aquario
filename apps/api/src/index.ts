import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { createApp } from "./app.js";

config();

const app = createApp();

const port = Number(process.env.PORT || 8787);
const hostname = process.env.HOST || "127.0.0.1";

serve(
  {
    fetch: app.fetch,
    port,
    hostname
  },
  () => {
    console.log(`API listening on http://${hostname}:${port}`);
  }
);
