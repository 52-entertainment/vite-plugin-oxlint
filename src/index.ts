import { Plugin } from 'vite'
import { spawn } from 'child_process'
import nodePath from 'path'
import { existsSync } from 'fs'
import { Options } from './types'
import { detect } from 'package-manager-detector/detect'
import { resolveCommand } from 'package-manager-detector/commands'

const oxlintPlugin = (options: Options = {}): Plugin => {
  let timeoutId: NodeJS.Timeout | null = null
  const debounceTime = 300

  const executeCommand = async () => {
    const {
      path = '',
      ignorePattern = '',
      configFile = 'oxlintrc.json',
      deny = [],
      allow = [],
      warn = [],
      params = ''
    } = options

    const args: string[] = []
    if (ignorePattern) {
      args.push(`--ignore-pattern=${ignorePattern}`)
    }
    deny.forEach(d => args.push('-D', d))
    allow.forEach(a => args.push('-A', a))
    warn.forEach(w => args.push('-W', w))

    const configFilePath = nodePath.join(process.cwd(), configFile)
    if (existsSync(configFilePath)) {
      args.push('-c', configFilePath)
    }

    if (params) {
      args.push(...params.split(' ').filter(Boolean))
    }

    const cwd = nodePath.join(process.cwd(), path)

    const pm = await detect()
    if (!pm) throw new Error('Could not detect package manager')

    return new Promise<void>((resolve, reject) => {
      const { command: cmd, args: cmdArgs } = resolveCommand(
        pm.agent,
        'execute-local',
        ['oxlint', ...args]
      ) as { command: string; args: string[] }

      const child = spawn(cmd, cmdArgs, {
        cwd,
        stdio: 'pipe',
        shell: true,
        env: {
          ...process.env,
          FORCE_COLOR: '1'
        }
      })

      child.stdout?.pipe(process.stdout)

      let stderrOutput = ''
      child.stderr?.on('data', data => {
        stderrOutput += data.toString()
        process.stderr.write(data) // Forward stderr with formatting intact
      })

      child.on('error', error => {
        console.error(`oxlint Error: ${error.message}`)
        reject(error)
      })

      child.on('exit', code => {
        if (code === 0) {
          console.log('\nOxlint successfully finished.')
        } else {
          console.warn(
            `\n\x1b[33mOxlint finished with exit code: ${code}\x1b[0m`
          )
        }
        resolve()
      })
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
        console.error('Error executing command:', error)
      }
    }, debounceTime)
  }

  return {
    name: 'vite-plugin-oxlint',
    async buildStart() {
      await handleCommandExecution()
    },
    async handleHotUpdate() {
      await handleCommandExecution()
    }
  }
}

export default oxlintPlugin
