import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import unoCSS from "unocss/astro";

// https://astro.build/config
export default defineConfig({
  base: "/solid-2048",
  integrations: [solidJs(), unoCSS({ injectReset: true })],
});
