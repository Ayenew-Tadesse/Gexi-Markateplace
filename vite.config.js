import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Two pages share one codebase and one demo database:
//   index.html  → the shop (customers)
//   seller.html → the Seller Center
// base './' lets the built site work from any folder (GitHub Pages, a USB stick, etc.)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        shop: resolve(import.meta.dirname, 'index.html'),
        seller: resolve(import.meta.dirname, 'seller.html'),
      },
    },
  },
})
