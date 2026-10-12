import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import * as federationModule from '@originjs/vite-plugin-federation'

const federation = federationModule.default

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'storefront',
      remotes: {
        products: 'http://localhost:4174/assets/remoteEntry.js',
        orders: 'http://localhost:4175/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
  },
})
