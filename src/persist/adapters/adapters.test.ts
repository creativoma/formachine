import { beforeEach, describe, expect, it } from 'vitest'
import { createAdapter } from './custom'
import { localStorage as localStorageAdapter } from './localStorage'
import { sessionStorage as sessionStorageAdapter } from './sessionStorage'

describe('Persistence Adapters', () => {
  describe('localStorageAdapter', () => {
    beforeEach(() => {
      window.localStorage.clear()
    })

    it('should store and retrieve items', () => {
      localStorageAdapter.setItem('test-key', 'test-value')
      const result = localStorageAdapter.getItem('test-key')

      expect(result).toBe('test-value')
    })

    it('should return null for non-existent keys', () => {
      const result = localStorageAdapter.getItem('non-existent')
      expect(result).toBeNull()
    })

    it('should remove items', () => {
      localStorageAdapter.setItem('test-key', 'test-value')
      localStorageAdapter.removeItem('test-key')

      const result = localStorageAdapter.getItem('test-key')
      expect(result).toBeNull()
    })

    it('should handle JSON data', () => {
      const data = JSON.stringify({ foo: 'bar', num: 123 })
      localStorageAdapter.setItem('json-key', data)

      const result = localStorageAdapter.getItem('json-key')
      // biome-ignore lint/style/noNonNullAssertion: Test verifies data exists
      expect(JSON.parse(result!)).toEqual({ foo: 'bar', num: 123 })
    })

    it('should overwrite existing values', () => {
      localStorageAdapter.setItem('key', 'value1')
      localStorageAdapter.setItem('key', 'value2')

      const result = localStorageAdapter.getItem('key')
      expect(result).toBe('value2')
    })
  })

  describe('sessionStorageAdapter', () => {
    beforeEach(() => {
      window.sessionStorage.clear()
    })

    it('should store and retrieve items', () => {
      sessionStorageAdapter.setItem('test-key', 'test-value')
      const result = sessionStorageAdapter.getItem('test-key')

      expect(result).toBe('test-value')
    })

    it('should return null for non-existent keys', () => {
      const result = sessionStorageAdapter.getItem('non-existent')
      expect(result).toBeNull()
    })

    it('should remove items', () => {
      sessionStorageAdapter.setItem('test-key', 'test-value')
      sessionStorageAdapter.removeItem('test-key')

      const result = sessionStorageAdapter.getItem('test-key')
      expect(result).toBeNull()
    })

    it('should be independent from localStorage', () => {
      localStorageAdapter.setItem('key', 'local-value')
      sessionStorageAdapter.setItem('key', 'session-value')

      expect(localStorageAdapter.getItem('key')).toBe('local-value')
      expect(sessionStorageAdapter.getItem('key')).toBe('session-value')
    })
  })

  describe('createAdapter', () => {
    it('should create a custom adapter', () => {
      const storage = new Map<string, string>()

      const adapter = createAdapter({
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          storage.set(key, value)
        },
        removeItem: (key) => {
          storage.delete(key)
        },
      })

      adapter.setItem('test', 'value')
      expect(adapter.getItem('test')).toBe('value')

      adapter.removeItem('test')
      expect(adapter.getItem('test')).toBeNull()
    })

    it('should work with async operations', async () => {
      const storage = new Map<string, string>()

      const adapter = createAdapter({
        getItem: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return storage.get(key) ?? null
        },
        setItem: async (key, value) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          storage.set(key, value)
        },
        removeItem: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          storage.delete(key)
        },
      })

      await adapter.setItem('test', 'value')
      const result = await adapter.getItem('test')
      expect(result).toBe('value')

      await adapter.removeItem('test')
      const afterRemove = await adapter.getItem('test')
      expect(afterRemove).toBeNull()
    })

    it('should allow mixed sync/async operations', async () => {
      const storage = new Map<string, string>()

      const adapter = createAdapter({
        getItem: (key) => storage.get(key) ?? null, // sync
        setItem: async (key, value) => {
          // async
          await new Promise((resolve) => setTimeout(resolve, 10))
          storage.set(key, value)
        },
        removeItem: (key) => {
          storage.delete(key)
        }, // sync
      })

      await adapter.setItem('test', 'value')
      const result = adapter.getItem('test')
      expect(result).toBe('value')
    })

    it('should handle errors in custom implementations', () => {
      const adapter = createAdapter({
        getItem: () => {
          throw new Error('Custom getItem error')
        },
        setItem: () => {},
        removeItem: () => {},
      })

      expect(() => adapter.getItem('test')).toThrow('Custom getItem error')
    })
  })

  describe('Adapter interface compliance', () => {
    const adapters = [
      { name: 'localStorage', adapter: localStorageAdapter },
      { name: 'sessionStorage', adapter: sessionStorageAdapter },
      {
        name: 'custom',
        adapter: createAdapter({
          getItem: (_key) => null,
          setItem: () => {},
          removeItem: () => {},
        }),
      },
    ]

    adapters.forEach(({ name, adapter }) => {
      describe(`${name} adapter`, () => {
        it('should have getItem method', () => {
          expect(typeof adapter.getItem).toBe('function')
        })

        it('should have setItem method', () => {
          expect(typeof adapter.setItem).toBe('function')
        })

        it('should have removeItem method', () => {
          expect(typeof adapter.removeItem).toBe('function')
        })
      })
    })
  })
})
