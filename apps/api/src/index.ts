import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { createApp } from "./app.js";

config();

const app = createApp();

const port = Number(process.env.PORT || 8787);

serve(
  {
    fetch: app.fetch,
    port
  },
  () => {
    console.log(`API listening on http://localhost:${port}`);
  }
);
