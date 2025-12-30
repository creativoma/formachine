export interface SyncPersistenceAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface AsyncPersistenceAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export type PersistenceAdapter =
  | SyncPersistenceAdapter
  | AsyncPersistenceAdapter
  | {
      getItem(key: string): string | null | Promise<string | null>
      setItem(key: string, value: string): void | Promise<void>
      removeItem(key: string): void | Promise<void>
    }

export interface PersistedData<T> {
  version: number
  timestamp: number
  data: T
}
