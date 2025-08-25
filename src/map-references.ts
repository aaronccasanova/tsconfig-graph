import type { ReferencesToConfigs, TSConfigGraph } from './types.js'

/**
 * Builds a mapping of referenced tsconfigs to tsconfigs that include them.
 */
export function mapReferences(
  tsConfigGraph: TSConfigGraph,
): ReferencesToConfigs {
  const referencesToConfigs: ReferencesToConfigs = {}
  const tsConfigGraphEntries = Object.entries(tsConfigGraph)

  for (const [configFileName, tsConfigGraphNode] of tsConfigGraphEntries) {
    for (const referencedConfigFileName of tsConfigGraphNode.references) {
      referencesToConfigs[referencedConfigFileName] ??= []
      referencesToConfigs[referencedConfigFileName].push(configFileName)
    }
  }

  for (const referencedConfigFileName of Object.keys(referencesToConfigs)) {
    referencesToConfigs[referencedConfigFileName]?.sort()
  }

  return referencesToConfigs
}
