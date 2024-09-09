import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
 
  site: 'https://localhost:4321',
  base: '',
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind(), icon()],
});
