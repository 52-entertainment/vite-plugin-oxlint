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
      ignorePattern = '',
      configFile = 'oxlintrc.json',
      deny = [],
      allow = [],
      warn = [],
      params = '',
      oxlintPath = '',
      format = '',
      quiet = false
    } = options

    const args: string[] = []
    if (quiet) {
      args.push('--quiet')
    }
    if (format) {
      args.push('--format', format)
    }
    if (ignorePattern) {
      args.push(`--ignore-pattern=${ignorePattern}`)
    }
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
        const {
          command: cmd,
          args: cmdArgs
        }: { command: string; args: string[] } = oxlintPath
          ? { command: resolveAbsolutePath(oxlintPath), args }
          : resolveCommand(
              pm.agent,
              useExecuteLocal ? 'execute-local' : 'execute',
              ['oxlint', ...args]
            )!

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
          const dataString = data.toString()

          if (
            !dataString.includes('undefined') &&
            !(dataString.includes('not found') && useExecuteLocal)
          ) {
            const trimmed = dataString.trimEnd()
            if (trimmed) {
              logger?.info(trimmed)
            }
          }
        })

        child.stderr?.on('data', data => {
          const trimmed = data.toString().trimEnd()
          if (trimmed) {
            logger?.error(trimmed)
          }
        })

        child.on('error', error => {
          logger?.error(`oxlint Error: ${error.message}`)
          reject(error)
        })

        child.on('exit', code => {
          if (code === 0) {
            logger?.info('Oxlint successfully finished.')
            resolve()
          } else if (!oxlintPath && useExecuteLocal && code !== 1) {
            executeWithFallback(false)
          } else {
            logger?.warn(`Oxlint finished with exit code: ${code}`)
            resolve()
          }
        })
      }

      executeWithFallback(true)
    })
  }

  const handleCommandExecution = async () => {
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
      await handleCommandExecution()
    },
    async handleHotUpdate() {
      await handleCommandExecution()
    }
  }
}

export default oxlintPlugin
