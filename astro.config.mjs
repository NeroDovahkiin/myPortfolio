import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
 
  site: 'https://nerodovahkiin.github.io',
  base: 'myPortfolio',
  output: 'server',
  integrations: [tailwind(), icon()],
});
