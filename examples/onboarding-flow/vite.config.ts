/** biome-ignore-all assist/source/organizeImports: '' */
import react from '@vitejs/plugin-react'
import { defineConfig, type PluginOption } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()] as PluginOption[],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@formachine/core': resolve(__dirname, '../../src/core'),
      '@formachine/persist': resolve(__dirname, '../../src/persist'),
      '@formachine/react': resolve(__dirname, '../../src/react'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})
