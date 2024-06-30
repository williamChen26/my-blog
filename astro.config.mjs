import { defineConfig, squooshImageService } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://williamChen26.github.io",
  base: "blog",
  image: {
    service: squooshImageService(),
  },
  integrations: [mdx(), sitemap(), tailwind()],
});
