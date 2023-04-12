import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  base: './',
  resolve: {
    alias: {
      '$': path.resolve('./src'),
      '$components': path.resolve('./src/components'),
      '$stores': path.resolve('./src/stores'),
      '$utils': path.resolve('./src/utils'),
      '$assets': path.resolve('./src/assets'),
    }
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    assetsInlineLimit: 32768,
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'Assets/[name].js',
        chunkFileNames: 'Assets/[name][extname]',
        assetFileNames: 'Assets/[name][extname]'
      }
    }
  },
  preview: {
    port: 7000
  },
  server: {
    port: 8000,
    // headers: {
    //   'X-Content-Type-Options': 'nosniff'
    // }
  },
})
