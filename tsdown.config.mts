import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtensions: ({ format }) => ({
    js: format === 'es' ? '.mjs' : '.cjs'
  })
})
