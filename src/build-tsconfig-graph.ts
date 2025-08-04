import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'

import ts from 'typescript'
import { globby } from 'globby'
import pLimit from 'p-limit'

import type { TSConfigGraph, TSConfigGraphNode } from './types.js'

type GlobbyParameters = Parameters<typeof globby>
type GlobbyPatterns = GlobbyParameters[0]
type GlobbyOptions = NonNullable<GlobbyParameters[1]>

export interface BuildTSConfigGraphOptions {
  /**
   * The maximum number of concurrent tsconfig file processing operations.
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
   */
  patterns?: GlobbyPatterns
  /**
   * Specific tsconfig files to include (takes precedence over `patterns`).
   */
  tsConfigFiles?: string[]
}

/**
 * Build a graph of tsconfigs to their owned files and references.
 */
export async function buildTSConfigGraph(
  options?: BuildTSConfigGraphOptions,
): Promise<TSConfigGraph> {
  const cwd = options?.cwd
    ? path.resolve(
        options.cwd instanceof URL
          ? url.fileURLToPath(options.cwd)
          : options.cwd,
      )
    : process.cwd()

  const patterns = options?.patterns || '**/tsconfig*.json'

  let tsConfigFilePaths: string[]

  if (options?.tsConfigFiles?.length) {
    tsConfigFilePaths = options.tsConfigFiles.map((tsConfigFile) =>
      path.isAbsolute(tsConfigFile)
        ? tsConfigFile
        : path.resolve(cwd, tsConfigFile),
    )
  } else {
    tsConfigFilePaths = await globby(patterns, {
      absolute: true,
      cwd,
      dot: options?.dot,
      gitignore: options?.gitignore,
      onlyFiles: true,
    })
  }

  const tsConfigGraph: TSConfigGraph = {}
  const errors: string[] = []

  const limit = pLimit(options?.concurrency ?? 50)

  await Promise.all(
    tsConfigFilePaths.map((tsConfigFilePath) =>
      limit(async () => {
        const tsConfigFileContent = await fs.promises
          .readFile(tsConfigFilePath, 'utf8')
          .catch(() => '')

        if (!tsConfigFileContent) return

        const { config, error } = ts.parseConfigFileTextToJson(
          tsConfigFilePath,
          tsConfigFileContent,
        )

        if (error) {
          errors.push(
            `Failed to read ${tsConfigFilePath}: ${error.messageText}`,
          )
          return
        }

        const tsConfigDirPath = path.dirname(tsConfigFilePath)

        const parsedConfig = ts.parseJsonConfigFileContent(
          config,
          ts.sys,
          tsConfigDirPath,
          undefined,
          tsConfigFilePath,
        )

        if (parsedConfig.errors?.length) {
          errors.push(
            `Errors parsing ${tsConfigFilePath}: ` +
              parsedConfig.errors.map((error) => error.messageText).join('; '),
          )
          return
        }

        const files = uniqueSort(
          parsedConfig.fileNames.map((fileName) =>
            normalizeFileName(fileName, cwd),
          ),
        )

        const references = uniqueSort(
          parsedConfig.projectReferences
            ?.map((projectReference) => {
              const resolvedProjectReferencePath =
                ts.resolveProjectReferencePath(projectReference)

              return normalizeFileName(resolvedProjectReferencePath, cwd)
            })
            ?.filter(Boolean) ?? [],
        )

        const tsConfigGraphNode: TSConfigGraphNode = {
          files,
          references,
        }

        const configFileName = normalizeFileName(tsConfigFilePath, cwd)

        tsConfigGraph[configFileName] = tsConfigGraphNode
      }),
    ),
  )

  if (errors.length) {
    const message =
      `Found ${errors.length} tsconfig error(s):\n` +
      errors.map((error) => `- ${error}`).join('\n')

    throw new Error(message)
  }

  return tsConfigGraph
}

function normalizeFileName(filePath: string, cwd: string): string {
  const fileName = path.relative(cwd, filePath)

  return fileName.replaceAll(path.sep, '/')
}

function uniqueSort<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr)).sort()
}
