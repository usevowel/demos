import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force React resolution to use this project's React, not from linked @vowel.to/client
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './node_modules/react/jsx-dev-runtime'),
    },
    // Deduplicate React to prevent multiple instances from linked packages
    dedupe: ['react', 'react-dom'],
  },
  build: {
    sourcemap: true, // Enable source maps for production builds
  },
})
