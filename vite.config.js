import { defineConfig } from 'vite';

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
