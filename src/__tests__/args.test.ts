import { describe, expect, it } from 'vitest'
import type { Logger } from 'vite'
import { fileURLToPath } from 'node:url'
import { buildArgs } from '../args'

const existingConfig = fileURLToPath(
  new URL('fixtures/custom-oxlintrc.json', import.meta.url)
)
const missingConfig = fileURLToPath(
  new URL('fixtures/does-not-exist.json', import.meta.url)
)

const createLogger = (): { logger: Logger; warnings: string[] } => {
  const logs: string[] = []
  const warnings: string[] = []
  const pushLog = (msg: string) => {
    logs.push(msg)
  }
  const logger: Logger = {
    clearScreen: pushLog,
    error: pushLog,
    hasErrorLogged: () => false,
    hasWarned: false,
    info: pushLog,
    warn: (msg: string) => {
      warnings.push(msg)
    },
    warnOnce: pushLog
  }
  return { logger, warnings }
}

describe('buildArgs', () => {
  it('should map boolean and string options to CLI flags', () => {
    const args = buildArgs({
      failOnWarning: true,
      fix: true,
      format: 'github',
      quiet: true
    })
    expect(args).toContain('--quiet')
    expect(args).toContain('--fix')
    expect(args).toContain('--deny-warnings')
    expect(args.join(' ')).toContain('--format github')
  }, 1000)

  it('should map deny, allow and warn rules', () => {
    const args = buildArgs({
      allow: ['no-debugger'],
      deny: ['correctness'],
      warn: ['suspicious']
    })
    expect(args.join(' ')).toContain('-D correctness')
    expect(args.join(' ')).toContain('-A no-debugger')
    expect(args.join(' ')).toContain('-W suspicious')
  }, 1000)

  it('should map ignore patterns and raw params', () => {
    const args = buildArgs({
      ignorePattern: ['*.test.js', 'dist/**'],
      params: '--threads 4'
    })
    expect(args).toContain('--ignore-pattern=*.test.js')
    expect(args).toContain('--ignore-pattern=dist/**')
    expect(args.join(' ')).toContain('--threads 4')
  }, 1000)

  it('should pass -c when the given config file exists', () => {
    const args = buildArgs({ configFile: existingConfig })
    expect(args.join(' ')).toContain(`-c ${existingConfig}`)
  }, 1000)

  it('should warn and omit -c when the given config file is missing', () => {
    const { logger, warnings } = createLogger()
    const args = buildArgs({ configFile: missingConfig }, logger)
    expect(args).not.toContain('-c')
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain(missingConfig)
  }, 1000)

  it('should not pass -c nor warn when no config file is given', () => {
    const { logger, warnings } = createLogger()
    const args = buildArgs({}, logger)
    expect(args).not.toContain('-c')
    expect(warnings).toHaveLength(0)
  }, 1000)
})
