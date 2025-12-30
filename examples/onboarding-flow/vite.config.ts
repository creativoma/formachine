/** biome-ignore-all assist/source/organizeImports: '' */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@formachine/core': resolve(__dirname, '../../packages/core/src'),
      '@formachine/persist': resolve(__dirname, '../../packages/persist/src'),
      '@formachine/react': resolve(__dirname, '../../packages/react/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
