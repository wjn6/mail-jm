import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const isWin = process.platform === 'win32'

const commands = [
  {
    name: 'backend',
    command: isWin ? 'npm.cmd' : 'npm',
    args: ['run', 'start:dev'],
    cwd: path.join(rootDir, 'backend')
  },
  {
    name: 'frontend',
    command: isWin ? 'pnpm.cmd' : 'pnpm',
    args: ['dev'],
    cwd: path.join(rootDir, 'frontend')
  }
]

const children = []
let isShuttingDown = false

const shutdown = (signal = 'SIGTERM') => {
  if (isShuttingDown) return
  isShuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal)
    }
  }
}

for (const task of commands) {
  const child = spawn(task.command, task.args, {
    cwd: task.cwd,
    stdio: 'inherit',
    env: process.env
  })

  children.push(child)

  child.on('exit', (code) => {
    if (isShuttingDown) return

    if (code && code !== 0) {
      console.error(`[${task.name}] exited with code ${code}`)
      process.exitCode = code
      shutdown()
      return
    }
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
