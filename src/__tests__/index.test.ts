import { describe, expect, it } from 'vitest'
import oxlintPlugin from '../index'

describe('oxlintPlugin', () => {
  it('should return a plugin with the correct name', () => {
    const plugin = oxlintPlugin()
    expect(plugin.name).toBe('vite-plugin-oxlint')
  }, 1000)

  it('should have required hooks', () => {
    const plugin = oxlintPlugin()
    expect(plugin).toHaveProperty('configResolved')
    expect(plugin).toHaveProperty('buildStart')
    expect(plugin).toHaveProperty('handleHotUpdate')
  }, 1000)

  it('should accept empty options', () => {
    expect(() => oxlintPlugin()).not.toThrow()
  }, 1000)

  it('should accept all options', () => {
    expect(() =>
      oxlintPlugin({
        allow: ['pedantic'],
        configFile: 'oxlintrc.json',
        deny: ['correctness'],
        failOnError: true,
        failOnWarning: true,
        fix: true,
        format: 'github',
        ignorePattern: ['*.test.js', 'dist/**'],
        lintOnStart: false,
        lintOnHotUpdate: false,
        params: '--threads 4',
        path: './src',
        quiet: true,
        warn: ['style']
      })
    ).not.toThrow()
  }, 1000)

  it('should accept a single ignorePattern string', () => {
    expect(() => oxlintPlugin({ ignorePattern: '*.test.js' })).not.toThrow()
  }, 1000)
})
