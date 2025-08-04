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
