import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outExtensions: ({ format }) => ({
    js: format === 'es' ? '.mjs' : '.cjs'
  })
})
