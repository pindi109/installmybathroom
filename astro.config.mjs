// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://installmybathroom.co.uk",
  trailingSlash: "always",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
