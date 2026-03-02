import { describe, it, expect } from 'vitest'
import oxlintPlugin from '../index'

describe('oxlintPlugin', () => {
  it('should return a plugin with the correct name', () => {
    const plugin = oxlintPlugin()
    expect(plugin.name).toBe('vite-plugin-oxlint')
  })

  it('should have required hooks', () => {
    const plugin = oxlintPlugin()
    expect(plugin).toHaveProperty('configResolved')
    expect(plugin).toHaveProperty('buildStart')
    expect(plugin).toHaveProperty('handleHotUpdate')
  })

  it('should accept empty options', () => {
    expect(() => oxlintPlugin()).not.toThrow()
  })

  it('should accept all options', () => {
    expect(() =>
      oxlintPlugin({
        path: './src',
        ignorePattern: ['*.test.js', 'dist/**'],
        configFile: 'oxlintrc.json',
        deny: ['correctness'],
        allow: ['pedantic'],
        warn: ['style'],
        params: '--threads 4',
        format: 'github',
        quiet: true,
        fix: true,
        failOnError: true,
        failOnWarning: true,
        lintOnStart: false
      })
    ).not.toThrow()
  })

  it('should accept a single ignorePattern string', () => {
    expect(() =>
      oxlintPlugin({ ignorePattern: '*.test.js' })
    ).not.toThrow()
  })
})
