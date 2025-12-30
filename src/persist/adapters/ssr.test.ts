import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { localStorage as localStorageAdapter } from './localStorage'
import { sessionStorage as sessionStorageAdapter } from './sessionStorage'

describe('SSR Support - Storage Adapters', () => {
  let originalWindow: typeof globalThis.window | undefined

  beforeEach(() => {
    // Simular ambiente servidor
    originalWindow = globalThis.window
    // @ts-expect-error - Intentionally deleting window for SSR simulation
    delete globalThis.window
  })

  afterEach(() => {
    // Restaurar window
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow
    }
  })

  describe('localStorage adapter', () => {
    it('should return null when window is undefined (SSR)', () => {
      const result = localStorageAdapter.getItem('test-key')
      expect(result).toBe(null)
    })

    it('should not throw when setting item in SSR', () => {
      expect(() => {
        localStorageAdapter.setItem('test-key', 'value')
      }).not.toThrow()
    })

    it('should not throw when removing item in SSR', () => {
      expect(() => {
        localStorageAdapter.removeItem('test-key')
      }).not.toThrow()
    })
  })

  describe('sessionStorage adapter', () => {
    it('should return null when window is undefined (SSR)', () => {
      const result = sessionStorageAdapter.getItem('test-key')
      expect(result).toBe(null)
    })

    it('should not throw when setting item in SSR', () => {
      expect(() => {
        sessionStorageAdapter.setItem('test-key', 'value')
      }).not.toThrow()
    })

    it('should not throw when removing item in SSR', () => {
      expect(() => {
        sessionStorageAdapter.removeItem('test-key')
      }).not.toThrow()
    })
  })
})
