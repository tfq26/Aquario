import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [vue(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:8787"
    }
  }
});