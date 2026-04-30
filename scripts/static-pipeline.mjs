import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(rootDir, 'static')

const staticCleanKeep = new Set([
  'entitlements.plist',
  'node_modules',
  'package.json',
  'pnpm-lock.yaml',
])

function run(command, args, options = {}) {
  const env = { ...process.env }

  for (const [key, value] of Object.entries(options.env ?? {})) {
    if (value == null) {
      delete env[key]
    } else {
      env[key] = value
    }
  }

  execFileSync(command, args, {
    cwd: options.cwd ?? rootDir,
    env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })
}

function clean() {
  mkdirSync(staticDir, { recursive: true })

  for (const entry of readdirSync(staticDir)) {
    if (staticCleanKeep.has(entry)) {
      continue
    }

    rmSync(path.join(staticDir, entry), {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 100,
    })
  }
}

function ensureStaticNodeModules() {
  if (!existsSync(path.join(staticDir, 'node_modules'))) {
    run('pnpm', ['install', '--frozen-lockfile'], { cwd: staticDir })
  }
}

function electron() {
  ensureStaticNodeModules()
  run('pnpm', ['electron:dev'], {
    cwd: staticDir,
    env: { ELECTRON_RUN_AS_NODE: null },
  })
}

function versionFromSource() {
  const versionSource = readFileSync(path.join(rootDir, 'src/main/frontend/version.cljs'), 'utf8')
  const match = versionSource.match(/[0-9.]{3,}/)

  if (!match) {
    throw new Error('release version error in src/**/*/version.cljs')
  }

  return match[0]
}

function electronMaker() {
  run('pnpm', ['cljs:release-electron'])
  run('pnpm', ['vite:workers-build'])

  const packagePath = path.join(staticDir, 'package.json')
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
  packageJson.version = versionFromSource()
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

  ensureStaticNodeModules()
  run('pnpm', ['electron:make'], { cwd: staticDir })
}

function syncWorkersToMobile() {
  const source = path.join(staticDir, 'js', 'db-worker.js')
  const dest = path.join(staticDir, 'mobile', 'js', 'db-worker.js')

  if (!existsSync(source)) {
    throw new Error(`Missing worker output: ${source}`)
  }

  mkdirSync(path.dirname(dest), { recursive: true })
  copyFileSync(source, dest)
}

function switchReactDevelopmentMode() {
  const pairs = [
    ['react.development.js', 'react.production.min.js'],
    ['react-dom.development.js', 'react-dom.production.min.js'],
  ]

  for (const [fromName, toName] of pairs) {
    const from = path.join(staticDir, 'js', fromName)
    const to = path.join(staticDir, 'js', toName)

    if (!existsSync(from)) {
      continue
    }

    rmSync(to, { force: true })
    renameSync(from, to)
  }
}

async function cap() {
  const mode = process.env.PLATFORM || 'ios'
  const logseqAppServerUrl = 'http://localhost:3002'

  if (typeof global.fetch === 'function') {
    try {
      await fetch(logseqAppServerUrl)
    } catch {
      throw new Error(`Please check if the service is ON. (${logseqAppServerUrl})`)
    }
  }

  process.stdout.write(`------ Cap ${mode.toUpperCase()} -----\n`)
  process.stdout.write(`Dev serve at: ${logseqAppServerUrl}\n`)
  process.stdout.write('--------------------------------------\n')

  run('pnpm', ['exec', 'cap', 'sync', mode], {
    env: { LOGSEQ_APP_SERVER_URL: logseqAppServerUrl },
  })
  rmSync(path.join(rootDir, 'ios/App/App/public/out'), { recursive: true, force: true })
  run('pnpm', ['exec', 'cap', 'run', mode], {
    env: { LOGSEQ_APP_SERVER_URL: logseqAppServerUrl },
  })
}

const tasks = {
  cap,
  clean,
  electron,
  'electron-maker': electronMaker,
  'switch-react-development-mode': switchReactDevelopmentMode,
  'sync-workers-to-mobile': syncWorkersToMobile,
}

const taskName = process.argv[2]
const task = tasks[taskName]

if (!task) {
  throw new Error(`Unknown static pipeline task: ${taskName}`)
}

await task()
