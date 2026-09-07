import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/test-voice-tools.ts', 'src/test-routes.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  shims: true,
  noExternal: [/@home-assets\/.*/],
  external: ['@prisma/client', '.prisma/client'],
});


