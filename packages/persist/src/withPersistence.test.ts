import { createFormFlow } from '@formachine/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createAdapter } from './adapters/custom'
import { withPersistence } from './withPersistence'

describe('withPersistence', () => {
  let storage: Map<string, string>

  beforeEach(() => {
    storage = new Map()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const testFlow = createFormFlow({
    id: 'test-flow',
    steps: {
      step1: {
        schema: z.object({ value1: z.string() }),
        next: 'step2',
      },
      step2: {
        schema: z.object({ value2: z.number() }),
        next: null,
      },
    },
    initial: 'step1',
  })

  const adapter = createAdapter({
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value)
    },
    removeItem: (key) => {
      storage.delete(key)
    },
  })

  describe('persist', () => {
    it('should save state to storage', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'test' }

      await persistedFlow.persist(state)

      const stored = storage.get('test-key')
      expect(stored).toBeDefined()

      // biome-ignore lint/style/noNonNullAssertion: Test verifies data exists
      const parsed = JSON.parse(stored!)
      expect(parsed.data.step1).toEqual({ value1: 'test' })
      expect(parsed.version).toBe(1)
      expect(parsed.timestamp).toBeDefined()
    })

    it('should include version in stored data', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 5,
      })

      const state = testFlow.getInitialState()
      await persistedFlow.persist(state)

      // biome-ignore lint/style/noNonNullAssertion: Test verifies data exists
      const stored = JSON.parse(storage.get('test-key')!)
      expect(stored.version).toBe(5)
    })

    it('should include timestamp in stored data', async () => {
      const now = 1234567890
      vi.setSystemTime(now)

      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      await persistedFlow.persist(state)

      // biome-ignore lint/style/noNonNullAssertion: Test verifies data exists
      const stored = JSON.parse(storage.get('test-key')!)
      expect(stored.timestamp).toBe(now)
    })
  })

  describe('hydrate', () => {
    it('should return null when no data is stored', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const result = await persistedFlow.hydrate()
      expect(result).toBeNull()
    })

    it('should restore state from storage', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'test' }
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated).toBeDefined()
      expect(hydrated?.data.step1).toEqual({ value1: 'test' })
    })

    it('should calculate path from stored data', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'test' }
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated?.path).toEqual(['step1', 'step2'])
    })

    it('should set current step to last path step', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'test' }
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated?.currentStep).toBe('step2')
    })

    it('should set completed steps from stored data', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'test' }
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated?.completedSteps.has('step1')).toBe(true)
    })

    it('should return null for expired data', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        ttl: 60000, // 1 minute
      })

      const state = testFlow.getInitialState()
      await persistedFlow.persist(state)

      // Advance time past TTL
      vi.advanceTimersByTime(61000)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated).toBeNull()
    })

    it('should remove expired data from storage', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        ttl: 60000,
      })

      const state = testFlow.getInitialState()
      await persistedFlow.persist(state)

      vi.advanceTimersByTime(61000)
      await persistedFlow.hydrate()

      expect(storage.has('test-key')).toBe(false)
    })

    it('should handle version mismatch without migration', async () => {
      // Store data with version 1
      const flow1 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 1,
      })

      const state = testFlow.getInitialState()
      await flow1.persist(state)

      // Try to hydrate with version 2 (no migration)
      const flow2 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 2,
      })

      const hydrated = await flow2.hydrate()
      expect(hydrated).toBeNull()
    })

    it('should clear storage on version mismatch without migration', async () => {
      const flow1 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 1,
      })

      const state = testFlow.getInitialState()
      await flow1.persist(state)

      const flow2 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 2,
      })

      await flow2.hydrate()
      expect(storage.has('test-key')).toBe(false)
    })

    it('should migrate data when version differs', async () => {
      const flow1 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 1,
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'old-format' }
      await flow1.persist(state)

      type TestData = Partial<{ step1: { value1: string }; step2: { value2: number } }>
      const migrate = vi.fn((data: unknown, oldVersion: number): TestData => {
        if (oldVersion === 1) {
          const typedData = data as { step1: { value1: string } }
          return {
            step1: { value1: typedData.step1.value1.toUpperCase() },
          }
        }
        return data as TestData
      })

      const flow2 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 2,
        migrate,
      })

      const hydrated = await flow2.hydrate()
      expect(hydrated?.data.step1).toEqual({ value1: 'OLD-FORMAT' })
      expect(migrate).toHaveBeenCalledWith({ step1: { value1: 'old-format' } }, 1)
    })

    it('should handle invalid JSON', async () => {
      storage.set('test-key', 'invalid-json')

      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated).toBeNull()
    })

    it('should clear storage on invalid JSON', async () => {
      storage.set('test-key', 'invalid-json')

      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      await persistedFlow.hydrate()
      expect(storage.has('test-key')).toBe(false)
    })

    it('should return null if migration returns null', async () => {
      const flow1 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 1,
      })

      const state = testFlow.getInitialState()
      await flow1.persist(state)

      type TestData = Partial<{ step1: { value1: string }; step2: { value2: number } }>
      const migrate = (_data: unknown, _oldVersion: number): TestData | null => null

      const flow2 = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
        version: 2,
        migrate,
      })

      const hydrated = await flow2.hydrate()
      expect(hydrated).toBeNull()
    })

    it('should use initial step when path is empty', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      state.data = {} // No data
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated?.currentStep).toBe('step1')
    })
  })

  describe('clear', () => {
    it('should remove data from storage', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      const state = testFlow.getInitialState()
      await persistedFlow.persist(state)

      expect(storage.has('test-key')).toBe(true)

      await persistedFlow.clear()

      expect(storage.has('test-key')).toBe(false)
    })

    it('should not throw when clearing non-existent data', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      await expect(persistedFlow.clear()).resolves.not.toThrow()
    })
  })

  describe('integration', () => {
    it('should preserve all FormFlow methods', () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-key',
      })

      expect(persistedFlow.getInitialState).toBeDefined()
      expect(persistedFlow.calculatePath).toBeDefined()
      expect(persistedFlow.getStepSchema).toBeDefined()
    })

    it('should work with branching flows', async () => {
      const branchingFlow = createFormFlow({
        id: 'branching',
        steps: {
          start: {
            schema: z.object({ type: z.enum(['a', 'b']) }),
            next: (data: { type: 'a' | 'b' }) => (data.type === 'a' ? 'branchA' : 'branchB'),
          },
          branchA: {
            schema: z.object({ valueA: z.string() }),
            next: null,
          },
          branchB: {
            schema: z.object({ valueB: z.number() }),
            next: null,
          },
        },
        initial: 'start',
      })

      const persistedFlow = withPersistence(branchingFlow, {
        adapter,
        key: 'branching-key',
      })

      const state = branchingFlow.getInitialState()
      state.data.start = { type: 'a' }
      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()
      expect(hydrated?.path).toEqual(['start', 'branchA'])
      expect(hydrated?.currentStep).toBe('branchA')
    })
  })

  describe('async adapters', () => {
    it('should work with async adapters', async () => {
      // Use real timers for this async test
      vi.useRealTimers()

      const asyncStorage = new Map<string, string>()
      const asyncAdapter = createAdapter({
        getItem: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          return asyncStorage.get(key) ?? null
        },
        setItem: async (key, value) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          asyncStorage.set(key, value)
        },
        removeItem: async (key) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          asyncStorage.delete(key)
        },
      })

      const persistedFlow = withPersistence(testFlow, {
        adapter: asyncAdapter,
        key: 'async-key',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'async-test' }

      await persistedFlow.persist(state)

      const hydrated = await persistedFlow.hydrate()

      expect(hydrated?.data.step1).toEqual({ value1: 'async-test' })

      // Restore fake timers for other tests
      vi.useFakeTimers()
    })
  })

  describe('SSR Support', () => {
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

    it('should handle hydrate() in SSR environment', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-ssr',
      })

      const result = await persistedFlow.hydrate()
      expect(result).toBe(null) // No data in SSR
    })

    it('should handle persist() in SSR environment', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-ssr',
      })

      const state = testFlow.getInitialState()
      state.data.step1 = { value1: 'ssr-test' }

      // Should not throw
      await expect(persistedFlow.persist(state)).resolves.toBeUndefined()
    })

    it('should handle clear() in SSR environment', async () => {
      const persistedFlow = withPersistence(testFlow, {
        adapter,
        key: 'test-ssr',
      })

      // Should not throw
      await expect(persistedFlow.clear()).resolves.toBeUndefined()
    })
  })
})
