export type MigrateFn<T> = (oldData: unknown, oldVersion: number) => T | null

export interface VersionedData<T> {
  version: number
  data: T
}

export function migrateData<T>(
  rawData: unknown,
  currentVersion: number,
  migrate?: MigrateFn<T>
): T | null {
  if (rawData === null || rawData === undefined) {
    return null
  }

  if (typeof rawData !== 'object') {
    return null
  }

  const versioned = rawData as VersionedData<T>

  if (versioned.version === currentVersion) {
    return versioned.data
  }

  if (migrate) {
    return migrate(versioned.data, versioned.version)
  }

  // Version mismatch and no migration function
  return null
}

export function wrapWithVersion<T>(data: T, version: number): VersionedData<T> {
  return {
    version,
    data,
  }
}
