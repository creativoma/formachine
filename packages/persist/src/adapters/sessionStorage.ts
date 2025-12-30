import type { SyncPersistenceAdapter } from './types'

export const sessionStorage: SyncPersistenceAdapter = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null
    }
    return window.sessionStorage.getItem(key)
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return
    }
    window.sessionStorage.setItem(key, value)
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return
    }
    window.sessionStorage.removeItem(key)
  },
}
