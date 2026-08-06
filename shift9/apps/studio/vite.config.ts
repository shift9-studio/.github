import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600, // three.js core is a single large chunk by design
  },
});
