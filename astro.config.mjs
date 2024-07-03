import { defineConfig } from "astro/config";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://avwrm-5iaaa-aaaal-qdhcq-cai.icp0.io",
  integrations: [mdx(), sitemap(), tailwind(), icon()],
});
