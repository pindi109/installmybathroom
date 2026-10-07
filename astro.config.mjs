// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://installmybathroom.co.uk",
  trailingSlash: "always",
  output: "static",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thank-you/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
