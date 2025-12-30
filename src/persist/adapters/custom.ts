import type { PersistenceAdapter } from './types'

export function createAdapter(options: {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}): PersistenceAdapter {
  return {
    getItem: options.getItem,
    setItem: options.setItem,
    removeItem: options.removeItem,
  }
}

export function createMemoryAdapter(): PersistenceAdapter {
  const storage = new Map<string, string>()

  return {
    getItem(key: string): string | null {
      return storage.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      storage.set(key, value)
    },
    removeItem(key: string): void {
      storage.delete(key)
    },
  }
}
