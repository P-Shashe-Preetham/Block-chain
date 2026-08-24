import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const checks = []

function version(command, args = ['--version']) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  } catch {
    return null
  }
}

function addCheck(name, passed, detail) {
  checks.push({ name, passed, detail })
}

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10)
addCheck('node', nodeMajor === 22, `detected ${process.versions.node}; project requires Node.js 22`)

const pnpmVersion = version('pnpm')
addCheck('pnpm', pnpmVersion === '11.21.0', `detected ${pnpmVersion ?? 'not found'}; project requires pnpm 11.21.0`)

addCheck('hardhat', existsSync(resolve(root, 'node_modules/.bin/hardhat')), 'run pnpm install --frozen-lockfile before contract commands')
addCheck('web-dependencies', existsSync(resolve(root, 'apps/web/node_modules')), 'web workspace dependencies are available after the frozen install')

const dockerComposeVersion = version('docker', ['compose', 'version'])
addCheck('docker-compose', dockerComposeVersion !== null, `detected ${dockerComposeVersion ?? 'not found'}; required only for bounded Compose workflows`)

const result = {
  purpose: 'Project-owned readiness check inspired by the developer-experience concept of AlgoKit doctor; it does not invoke or require AlgoKit.',
  checks,
  passed: checks.every((check) => check.passed),
  next: ['pnpm install --frozen-lockfile', 'pnpm validate:environment', 'pnpm lint', 'pnpm test'],
}

console.log(JSON.stringify(result, null, 2))
process.exitCode = result.passed ? 0 : 1
