import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
// import mkcert from 'vite-plugin-mkcert'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    cloudflare(),
    // mkcert(),
  ],
  server: {
    // https: true,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // { find: '@convex', replacement: path.resolve(__dirname, '../convex') },
    ],
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude convex generated files that don't exist in this demo
        // /convex\/_generated/,
        // /@convex\/_generated/,
      ],
    },
  },
  envDir: '.',
})
