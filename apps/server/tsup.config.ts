import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/test-routes.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  noExternal: [/@home-assets\/.*/],
});
