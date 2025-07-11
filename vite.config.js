import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      }
    },
  },
  json: {
    namedExports: true,
    stringify: true,
  },
});
