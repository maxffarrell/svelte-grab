import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['bippy'],
  esbuildOptions: (options) => {
    options.globalName = 'SvelteGrab'
    return options
  },
})