import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    core: 'src/core/index.ts',
    persist: 'src/persist/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  splitting: false,
  external: ['react', 'react-dom', 'react-hook-form', 'zod'],
})
