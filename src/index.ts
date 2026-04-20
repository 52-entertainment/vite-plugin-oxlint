import type { Logger, Plugin } from 'vite'
import { spawn } from 'cross-spawn'
import nodePath from 'node:path'
import { existsSync } from 'node:fs'
import type { Options } from './types'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'

const DEBOUNCE_MS = 300

const resolveAbsolutePath = (p: string): string =>
  nodePath.isAbsolute(p) ? p : nodePath.join(process.cwd(), p)

const buildArgs = (options: Options): string[] => {
  const {
    ignorePattern,
    configFile = 'oxlintrc.json',
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

  const configFilePath = resolveAbsolutePath(configFile)
  if (existsSync(configFilePath)) {
    args.push('-c', configFilePath)
  }

  if (params) {
    args.push(...params.split(' ').filter(Boolean))
  }

  return args
}

interface RunChildParams {
  cmd: string
  args: string[]
  cwd: string
  logger: Logger | undefined
  shouldFail: boolean
  buffered: boolean
}

type RunChildResult = 'ok' | 'lint-errors' | 'fallback'

const runChild = ({
  cmd,
  args,
  cwd,
  logger,
  shouldFail,
  buffered
}: RunChildParams): Promise<RunChildResult> =>
  new Promise((resolve, reject) => {
    const bufferedOutput: string[] = []
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' },
      shell: false,
      stdio: 'pipe'
    })

    const emit = (data: Buffer, log: (s: string) => void) => {
      const trimmed = data.toString().trimEnd()
      if (!trimmed) {
        return
      }
      if (buffered) {
        bufferedOutput.push(trimmed)
      } else {
        log(trimmed)
      }
    }

    child.stdout?.on('data', d => emit(d, s => logger?.info(s)))
    child.stderr?.on('data', d => emit(d, s => logger?.error(s)))

    child.on('error', error => {
      if (buffered) {
        resolve('fallback')
        return
      }
      logger?.error(`oxlint Error: ${error.message}`)
      reject(error)
    })

    child.on('exit', code => {
      const flush = () => bufferedOutput.forEach(line => logger?.info(line))
      if (code === 0) {
        if (buffered) {
          flush()
        }
        logger?.info('Oxlint successfully finished.')
        resolve('ok')
      } else if (code === 1) {
        if (buffered) {
          flush()
        }
        if (shouldFail) {
          reject(new Error('Oxlint found lint errors.'))
        } else {
          logger?.warn('Oxlint found lint errors.')
          resolve('lint-errors')
        }
      } else if (buffered) {
        resolve('fallback')
      } else {
        logger?.error(`Oxlint exited with unexpected code: ${code}`)
        resolve('ok')
      }
    })
  })

const runOxlintOnce = async (
  options: Options,
  logger: Logger | undefined,
  pmPromise: ReturnType<typeof detect>
) => {
  const {
    path = '',
    oxlintPath = '',
    failOnError = false,
    failOnWarning = false
  } = options
  const shouldFail = failOnError || failOnWarning
  const args = buildArgs(options)
  const cwd = resolveAbsolutePath(path)

  const pm = await pmPromise
  if (!pm) {
    throw new Error('Could not detect package manager')
  }

  const tryRun = async (useExecuteLocal: boolean): Promise<void> => {
    const resolved = oxlintPath
      ? { args, command: resolveAbsolutePath(oxlintPath) }
      : resolveCommand(
          pm.agent,
          useExecuteLocal ? 'execute-local' : 'execute',
          ['oxlint', ...args]
        )

    if (!resolved) {
      if (useExecuteLocal && !oxlintPath) {
        return tryRun(false)
      }
      throw new Error(`Could not resolve oxlint command for ${pm.agent}`)
    }

    const result = await runChild({
      args: resolved.args,
      buffered: useExecuteLocal && !oxlintPath,
      cmd: resolved.command,
      cwd,
      logger,
      shouldFail
    })
    if (result === 'fallback') {
      return tryRun(false)
    }
  }

  return tryRun(true)
}

const oxlintPlugin = (options: Options = {}): Plugin => {
  let timeoutId: NodeJS.Timeout | undefined = undefined
  let pmPromise: ReturnType<typeof detect> | undefined = undefined
  let logger: Logger | undefined = undefined

  const getPm = () => {
    if (!pmPromise) {
      pmPromise = detect()
    }
    return pmPromise
  }

  const runOxlint = async () => {
    try {
      await runOxlintOnce(options, logger, getPm())
    } catch (error) {
      logger?.error(`Error executing command: ${error}`)
      throw error
    }
  }

  const debouncedRun = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(async () => {
      try {
        await runOxlintOnce(options, logger, getPm())
      } catch (error) {
        logger?.error(`Error executing command: ${error}`)
      }
    }, DEBOUNCE_MS)
  }

  return {
    async buildStart() {
      const { lintOnStart = true } = options
      if (lintOnStart) {
        await runOxlint()
      }
    },
    configResolved(config) {
      logger = config.logger
    },
    handleHotUpdate() {
      debouncedRun()
    },
    name: 'vite-plugin-oxlint'
  }
}

export default oxlintPlugin
