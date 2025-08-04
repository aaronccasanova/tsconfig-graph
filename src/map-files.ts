import type { FilesToConfigs, TSConfigGraph } from './types.js'

/**
 * Build a mapping of files to tsconfigs that own them.
 */
export function mapFiles(tsConfigGraph: TSConfigGraph): FilesToConfigs {
  const filesToConfigs: FilesToConfigs = {}
  const tsConfigGraphEntries = Object.entries(tsConfigGraph)

  for (const [configFileName, tsConfigGraphNode] of tsConfigGraphEntries) {
    for (const fileName of tsConfigGraphNode.files) {
      filesToConfigs[fileName] ??= []
      filesToConfigs[fileName].push(configFileName)
    }
  }

  for (const fileName of Object.keys(filesToConfigs)) {
    filesToConfigs[fileName]?.sort()
  }

  return filesToConfigs
}
