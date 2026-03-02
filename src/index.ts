import { Plugin, Logger } from 'vite'
import { spawn } from 'cross-spawn'
import nodePath from 'path'
import { existsSync } from 'fs'
import { Options } from './types'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'

const resolveAbsolutePath = (p: string): string =>
  nodePath.isAbsolute(p) ? p : nodePath.join(process.cwd(), p)

const oxlintPlugin = (options: Options = {}): Plugin => {
  let timeoutId: NodeJS.Timeout | null = null
  const debounceTime = 300
  let pmPromise: ReturnType<typeof detect> | null = null
  let logger: Logger | undefined

  const getPm = () => {
    if (!pmPromise) {
      pmPromise = detect()
    }
    return pmPromise
  }

  const executeCommand = async () => {
    const {
      path = '',
      ignorePattern,
      configFile = 'oxlintrc.json',
      deny = [],
      allow = [],
      warn = [],
      params = '',
      oxlintPath = '',
      format = '',
      quiet = false,
      fix = false,
      failOnError = false,
      failOnWarning = false
    } = options

    const shouldFail = failOnError || failOnWarning

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

    const cwd = resolveAbsolutePath(path)

    const pm = await getPm()
    if (!pm) throw new Error('Could not detect package manager')

    return new Promise<void>((resolve, reject) => {
      const executeWithFallback = (useExecuteLocal: boolean) => {
        const resolved = oxlintPath
          ? { command: resolveAbsolutePath(oxlintPath), args }
          : resolveCommand(
              pm.agent,
              useExecuteLocal ? 'execute-local' : 'execute',
              ['oxlint', ...args]
            )

        if (!resolved) {
          if (useExecuteLocal && !oxlintPath) {
            executeWithFallback(false)
            return
          }
          reject(
            new Error(`Could not resolve oxlint command for ${pm.agent}`)
          )
          return
        }

        const { command: cmd, args: cmdArgs } = resolved
        const bufferedOutput: string[] = []

        const child = spawn(cmd, cmdArgs, {
          cwd,
          stdio: 'pipe',
          shell: false,
          env: {
            ...process.env,
            FORCE_COLOR: '1'
          }
        })

        child.stdout?.on('data', data => {
          const trimmed = data.toString().trimEnd()
          if (trimmed) {
            if (useExecuteLocal && !oxlintPath) {
              bufferedOutput.push(trimmed)
            } else {
              logger?.info(trimmed)
            }
          }
        })

        child.stderr?.on('data', data => {
          const trimmed = data.toString().trimEnd()
          if (trimmed) {
            if (useExecuteLocal && !oxlintPath) {
              bufferedOutput.push(trimmed)
            } else {
              logger?.error(trimmed)
            }
          }
        })

        child.on('error', error => {
          if (useExecuteLocal && !oxlintPath) {
            executeWithFallback(false)
          } else {
            logger?.error(`oxlint Error: ${error.message}`)
            reject(error)
          }
        })

        child.on('exit', code => {
          const flushBuffer = () => {
            bufferedOutput.forEach(line => logger?.info(line))
          }

          if (code === 0) {
            if (useExecuteLocal && !oxlintPath) flushBuffer()
            logger?.info('Oxlint successfully finished.')
            resolve()
          } else if (code === 1) {
            if (useExecuteLocal && !oxlintPath) flushBuffer()
            if (shouldFail) {
              reject(new Error('Oxlint found lint errors.'))
            } else {
              logger?.warn('Oxlint found lint errors.')
              resolve()
            }
          } else if (useExecuteLocal && !oxlintPath) {
            executeWithFallback(false)
          } else {
            logger?.error(`Oxlint exited with unexpected code: ${code}`)
            resolve()
          }
        })
      }

      executeWithFallback(true)
    })
  }

  const runOxlint = async () => {
    try {
      await executeCommand()
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
        await executeCommand()
      } catch (error) {
        logger?.error(`Error executing command: ${error}`)
      }
    }, debounceTime)
  }

  return {
    name: 'vite-plugin-oxlint',
    configResolved(config) {
      logger = config.logger
    },
    async buildStart() {
      const { lintOnStart = true } = options
      if (lintOnStart) {
        await runOxlint()
      }
    },
    async handleHotUpdate() {
      debouncedRun()
    }
  }
}

export default oxlintPlugin
