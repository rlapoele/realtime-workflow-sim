import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

const mode = process.env.NODE_ENV ?? "development";
const environment = loadEnv(mode, process.cwd(), "");

if (mode === "production" && !environment.PUBLIC_API_URL?.trim()) {
  throw new Error("PUBLIC_API_URL is required for production builds");
}

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  output: "server",
  server: { host: true },
  vite: {
    plugins: [tailwindcss()],
  },
});
