#!/usr/bin/env node

const { Sandbox } = require('e2b')
const readline = require('readline')

const TARGET_STATES = new Set(['paused', 'running'])

function parseArgs(argv) {
  const args = new Set(argv)
  const pausedOnly = args.has('--paused-only')
  const runningOnly = args.has('--running-only')
  const dryRun = args.has('--dry-run')
  const yes = args.has('--yes')

  if (pausedOnly && runningOnly) {
    throw new Error('Use only one of --paused-only or --running-only')
  }

  const states = pausedOnly
    ? ['paused']
    : runningOnly
      ? ['running']
      : ['paused', 'running']

  return { states, dryRun, yes }
}

async function listSandboxesByState(state) {
  const paginator = Sandbox.list({ state })
  const sandboxes = []

  while (paginator.hasNext) {
    const items = await paginator.nextItems()
    sandboxes.push(...items)
  }

  return sandboxes
}

async function killSandboxes(sandboxes, { dryRun }) {
  let killed = 0

  for (const sandbox of sandboxes) {
    const line = `${sandbox.sandboxId} ${sandbox.state}${sandbox.name ? ` ${sandbox.name}` : ''}`
    if (dryRun) {
      console.log(`[dry-run] would kill ${line}`)
      continue
    }

    const ok = await Sandbox.kill(sandbox.sandboxId)
    if (ok) {
      killed += 1
      console.log(`killed ${line}`)
    } else {
      console.log(`not-found ${line}`)
    }
  }

  return killed
}

function dedupeSandboxes(entries) {
  const seen = new Set()
  const deduped = []

  for (const [state, sandboxes] of entries) {
    const uniqueSandboxes = []
    for (const sandbox of sandboxes) {
      if (seen.has(sandbox.sandboxId)) continue
      seen.add(sandbox.sandboxId)
      uniqueSandboxes.push(sandbox)
    }
    deduped.push([state, uniqueSandboxes])
  }

  return deduped
}

async function confirmDangerousAction({ totalMatched, states }) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const requiredPhrase = "I know what I'm doing"
  const prompt = `About to kill ${totalMatched} E2B sandbox(es) in state(s): ${states.join(', ')}. Type '${requiredPhrase}' to continue: `

  try {
    const answer = await new Promise((resolve) => rl.question(prompt, resolve))
    return answer.trim() === requiredPhrase
  } finally {
    rl.close()
  }
}

async function main() {
  if (!process.env.E2B_API_KEY) {
    throw new Error('E2B_API_KEY is required')
  }

  const { states, dryRun, yes } = parseArgs(process.argv.slice(2))
  const invalid = states.filter((state) => !TARGET_STATES.has(state))
  if (invalid.length > 0) {
    throw new Error(`Unsupported state(s): ${invalid.join(', ')}`)
  }

  let totalMatched = 0
  const sandboxesByState = []

  for (const state of states) {
    const sandboxes = await listSandboxesByState(state)
    sandboxesByState.push([state, sandboxes])
    totalMatched += sandboxes.length
  }

  const dedupedSandboxesByState = dedupeSandboxes(sandboxesByState)
  totalMatched = dedupedSandboxesByState.reduce((acc, [, sandboxes]) => acc + sandboxes.length, 0)

  for (const [state, sandboxes] of dedupedSandboxesByState) {
    console.log(`${state}: ${sandboxes.length} sandbox(es) matched`)
  }

  if (dryRun) {
    for (const [, sandboxes] of dedupedSandboxesByState) {
      await killSandboxes(sandboxes, { dryRun: true })
    }
    console.log(`dry-run complete: ${totalMatched} sandbox(es) matched`)
    return
  }

  if (totalMatched === 0) {
    console.log('done: no matching sandboxes')
    return
  }

  if (!yes) {
    const confirmed = await confirmDangerousAction({ totalMatched, states })
    if (!confirmed) {
      console.log('aborted')
      process.exit(1)
    }
  }

  let totalKilled = 0
  for (const [, sandboxes] of dedupedSandboxesByState) {
    totalKilled += await killSandboxes(sandboxes, { dryRun: false })
  }

  console.log(`done: killed ${totalKilled} of ${totalMatched} sandbox(es)`)
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
