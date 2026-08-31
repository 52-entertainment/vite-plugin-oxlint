import type { Logger } from 'vite'
import nodePath from 'node:path'
import { existsSync } from 'node:fs'
import type { Options } from './types'

const resolveAbsolutePath = (p: string): string =>
  nodePath.isAbsolute(p) ? p : nodePath.join(process.cwd(), p)

const buildArgs = (options: Options, logger?: Logger): string[] => {
  const {
    ignorePattern,
    configFile,
    deny = [],
    allow = [],
    warn = [],
    params = '',
    format = '',
    quiet = false,
    fix = false,
    failOnWarning = false
  } = options

  const args: string[] = []
  if (quiet) {
    args.push('--quiet')
  }
  if (fix) {
    args.push('--fix')
  }
  if (format) {
    args.push('--format', format)
  }
  if (failOnWarning) {
    args.push('--deny-warnings')
  }

  const patterns = Array.isArray(ignorePattern)
    ? ignorePattern
    : ignorePattern
      ? [ignorePattern]
      : []
  patterns.forEach(pattern => args.push(`--ignore-pattern=${pattern}`))

  deny.forEach(d => args.push('-D', d))
  allow.forEach(a => args.push('-A', a))
  warn.forEach(w => args.push('-W', w))

  if (configFile) {
    const configFilePath = resolveAbsolutePath(configFile)
    if (existsSync(configFilePath)) {
      args.push('-c', configFilePath)
    } else {
      logger?.warn(
        `Oxlint config file not found: ${configFilePath}. Falling back to oxlint's automatic config discovery.`
      )
    }
  } else {
    // Only probe the legacy dot-less name `oxlintrc.json`.
    // Oxlint auto-discovers `.oxlintrc.json(c)` and `oxlint.config.ts` itself.
    // It also loads nested configs, which an explicit `-c` would disable.
    const legacyConfigPath = resolveAbsolutePath('oxlintrc.json')
    if (existsSync(legacyConfigPath)) {
      args.push('-c', legacyConfigPath)
    }
  }

  if (params) {
    args.push(...params.split(' ').filter(Boolean))
  }

  return args
}

export { buildArgs, resolveAbsolutePath }
