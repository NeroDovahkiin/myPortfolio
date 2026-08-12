import tailwind from "@astrojs/tailwind";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({

  site: 'https://fguzzodev.com',
  base: '',
  adapter: vercel(),
  integrations: [tailwind(), icon()],
  devToolbar: { enabled: false },
  security: {
    allowedDomains: [
      { hostname: 'fguzzodev.com' },
      { hostname: 'www.fguzzodev.com' },
    ],
  },
});
