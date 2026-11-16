import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// Generates the favicon, apple touch icon and manifest icons from one svg.
// Run with: npm run generate-pwa-assets
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset,
  images: ['public/logo.svg'],
});
