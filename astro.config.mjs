import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({

  site: 'https://nerodovahkiin.github.io',
  base: '',
  adapter: vercel(),
  integrations: [tailwind(), icon()],
  devToolbar: { enabled: false },
});
