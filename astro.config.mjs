import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
 
  site: 'https://nerodovahkiin.github.io',
  base: '',
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind(), icon()],
});
