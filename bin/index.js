#!/usr/bin/env node
import * as util from 'node:util'

import { buildTSConfigGraph, mapFiles, mapReferences } from '../dist/index.js'

const helpMessage = `
tsconfig-graph - Build a graph of tsconfigs to their owned files and references.

USAGE:
  tsconfig-graph <command> [patterns...] [--cwd <dir>] [--pretty]

COMMANDS:
  build           Build and print the tsconfig graph
  map-files       Print file -> configs mapping
  map-references  Print referenced-config -> configs mapping
  help            Show this help message

NOTES:
  - patterns: file paths or glob patterns to find tsconfig files (default: '**/tsconfig*.json')
  - --cwd defaults to current directory
  - --pretty pretty-prints JSON output
`

async function main() {
  const args = process.argv.slice(2)

  const command = args[0] || 'help'

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      console.log(helpMessage)
      break

    case 'build':
      await handleBuild()
      break

    case 'map-files':
      await handleMapFiles()
      break

    case 'map-references':
      await handleMapReferences()
      break

    default:
      console.error(`Error: Unknown command "${command}"`)
      console.log(helpMessage)
      process.exit(1)
  }
}

function getArgs() {
  const args = util.parseArgs({
    allowPositionals: true,
    options: {
      cwd: { type: 'string' },
      dot: { type: 'boolean' },
      gitignore: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      pretty: { type: 'boolean' },
      concurrency: { type: 'string' },
    },
  })

  args.positionals.shift() // remove command

  return args
}

async function handleBuild() {
  const args = getArgs()

  if (args.values.help) {
    console.log(helpMessage)
    return
  }

  const patterns = args.positionals.length
    ? args.positionals
    : ['**/tsconfig*.json']

  const tsConfigGraph = await buildTSConfigGraph({
    concurrency: args.values.concurrency
      ? parseInt(args.values.concurrency, 10)
      : undefined,
    cwd: args.values.cwd,
    dot: args.values.dot,
    gitignore: args.values.gitignore,
    patterns,
  })

  const output = JSON.stringify(tsConfigGraph, null, args.values.pretty ? 2 : 0)

  console.log(output)
}

async function handleMapFiles() {
  const args = getArgs()

  if (args.values.help) {
    console.log(helpMessage)
    return
  }

  const patterns = args.positionals.length
    ? args.positionals
    : ['**/tsconfig*.json']

  const tsConfigGraph = await buildTSConfigGraph({
    concurrency: args.values.concurrency
      ? parseInt(args.values.concurrency, 10)
      : undefined,
    cwd: args.values.cwd,
    dot: args.values.dot,
    gitignore: args.values.gitignore,
    patterns,
  })

  const filesToConfigs = mapFiles(tsConfigGraph)

  const output = JSON.stringify(
    filesToConfigs,
    null,
    args.values.pretty ? 2 : 0,
  )

  console.log(output)
}

async function handleMapReferences() {
  const args = getArgs()

  if (args.values.help) {
    console.log(helpMessage)
    return
  }

  const patterns = args.positionals.length
    ? args.positionals
    : ['**/tsconfig*.json']

  const tsConfigGraph = await buildTSConfigGraph({
    concurrency: args.values.concurrency
      ? parseInt(args.values.concurrency, 10)
      : undefined,
    cwd: args.values.cwd,
    dot: args.values.dot,
    gitignore: args.values.gitignore,
    patterns,
  })

  const referencesToConfigs = mapReferences(tsConfigGraph)

  const output = JSON.stringify(
    referencesToConfigs,
    null,
    args.values.pretty ? 2 : 0,
  )

  console.log(output)
}

main()
