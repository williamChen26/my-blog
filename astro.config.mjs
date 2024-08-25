import { defineConfig, squooshImageService } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://williamChen26.github.io",
  base: "my-blog",
  image: {
    service: squooshImageService(),
  },
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    //mode: 'mdx',
    remarkPlugins: [
      "remark-gfm", "remark-smartypants",
      "remark-math" 
    ],
    rehypePlugins: [
      //'rehype-slug', < needed only prior beta.22
      "rehype-mathjax" 
    ]
  }
});
