import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // The worker lives in apps/worker; the plugin runs it inside Vite in dev and bundles it with the app on build.
  plugins: [react(), tailwindcss(), cloudflare({ configPath: '../worker/wrangler.jsonc' })],
});
