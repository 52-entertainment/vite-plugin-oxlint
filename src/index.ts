import type { Logger, Plugin } from 'vite'
import { spawn } from 'cross-spawn'
import type { Options } from './types'
import { buildArgs, resolveAbsolutePath } from './args'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'

const DEBOUNCE_MS = 300

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

    const flush = () => bufferedOutput.forEach(line => logger?.info(line))

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
  const args = buildArgs(options, logger)
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
      const { lintOnHotUpdate = true } = options
      if (lintOnHotUpdate) {
        debouncedRun()
      }
    },
    name: 'vite-plugin-oxlint'
  }
}

export default oxlintPlugin
