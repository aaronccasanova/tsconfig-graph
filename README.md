# tsconfig-graph

Builds a graph of tsconfigs to the files they own and the project references they declare. Includes helpers to invert files to configs and references to configs.

## CLI Usage

### Build graph

```sh
npx tsconfig-graph build
#=> {
#     "app/tsconfig.json": {
#       "files": [
#         "app/src/index.ts",
#         "app/src/types.ts"
#       ],
#       "references": [
#         "utils/tsconfig.json"
#       ]
#     },
#     "utils/tsconfig.json": {
#       "files": [
#         "utils/src/index.ts",
#         "utils/src/types.ts"
#       ],
#       "references": []
#     }
#   }
```

### Map files to configs

Invert the `TSConfigGraph`'s `files` to produce a mapping of files to tsconfigs that own them.

```sh
npx tsconfig-graph map-files
#=> {
#     "app/src/index.ts": ["app/tsconfig.json"],
#     "app/src/types.ts": ["app/tsconfig.json"],
#     "utils/src/index.ts": ["utils/tsconfig.json"],
#     "utils/src/types.ts": ["utils/tsconfig.json"]
#   }
```

### Map references to configs

Invert the `TSConfigGraph`'s `references` to produce a mapping of referenced-configs to tsconfigs that include them.

```sh
npx tsconfig-graph map-references
#=> {
#     "utils/tsconfig.json": ["app/tsconfig.json"]
#   }
```

## Library Usage

```ts
import { buildTSConfigGraph, mapFiles, mapReferences } from 'tsconfig-graph'

const tsConfigGraph = await buildTSConfigGraph()

const filesToConfigs = mapFiles(tsConfigGraph)

const referencesToConfigs = mapReferences(tsConfigGraph)
```

## API

## Types

```ts
export interface BuildTSConfigGraphOptions {
  /**
   * The maximum number of concurrently processed tsconfigs.
   * @default 50
   */
  concurrency?: number
  /**
   * The current working directory in which to search.
   *
   * @default process.cwd()
   */
  cwd?: GlobbyOptions['cwd']
  /**
   * Allow patterns to match entries that begin with a period (.).
   *
   * @default false
   */
  dot?: GlobbyOptions['dot']
  /**
   * Respect ignore patterns in .gitignore files that apply to the globbed files.
   *
   * @default false
   */
  gitignore?: GlobbyOptions['gitignore']
  /**
   * Glob patterns to match tsconfig files.
   *
   * @default '**\/tsconfig*.json'
   */
  patterns?: GlobbyPatterns
  /**
   * Specific tsconfig files to include (takes precedence over `patterns`).
   */
  tsConfigFiles?: string[]
}

/** Path to a tsconfig file (relative to cwd, POSIX separators) */
export type ConfigFileName = string

/** Path to a file (relative to cwd, POSIX separators) */
export type FileName = string

export interface TSConfigGraphNode {
  files: FileName[]
  references: ConfigFileName[]
}

/**
 * Graph of tsconfigs to owned files and references.
 */
export interface TSConfigGraph {
  [configFileName: ConfigFileName]: TSConfigGraphNode
}

/**
 * Mapping of files to tsconfigs that own them.
 */
export interface FilesToConfigs {
  [fileName: FileName]: ConfigFileName[]
}

/**
 * Mapping of referenced tsconfigs to tsconfigs that include them.
 */
export interface ReferencesToConfigs {
  [configFileName: ConfigFileName]: ConfigFileName[]
}
```

### Functions

- `buildTSConfigGraph(options?) => Promise<TSConfigGraph>`
- `mapFiles(tsConfigGraph) => FilesToConfigs`
- `mapReferences(tsConfigGraph) => ReferencesToConfigs`

## Features

- **Deterministic output:** All results are sorted for consistent output
- **POSIX paths:** Uses forward slashes regardless of platform
- **Relative paths:** All paths are relative to the specified `cwd`
- **TypeScript-native:** Uses the TypeScript compiler API for accurate parsing

## Use Cases

- **Monorepo management:** Understand which packages own which files
- **Build optimization:** Identify overlapping TypeScript configurations
- **Code organization:** Find files that might belong to multiple projects
- **Migration assistance:** Help when restructuring TypeScript projects
