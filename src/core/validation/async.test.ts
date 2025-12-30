import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAbortableValidation,
  createCacheKey,
  createValidationCache,
  debounce,
  withRetry,
} from './async'

describe('Async Validation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('createValidationCache', () => {
    it('should store and retrieve values', async () => {
      const cache = createValidationCache()

      cache.set('test-key', true)
      const result = await cache.get('test-key')

      expect(result).toBe(true)
    })

    it('should return undefined for non-existent keys', async () => {
      const cache = createValidationCache()
      const result = await cache.get('non-existent')

      expect(result).toBeUndefined()
    })

    it('should expire entries after TTL', async () => {
      const cache = createValidationCache(1000) // 1 second default TTL

      cache.set('test-key', true)

      // Immediately after setting
      expect(await cache.get('test-key')).toBe(true)

      // After TTL expires
      vi.advanceTimersByTime(1001)
      expect(await cache.get('test-key')).toBeUndefined()
    })

    it('should allow custom TTL per entry', async () => {
      const cache = createValidationCache(1000)

      cache.set('short', true, 500)
      cache.set('long', true, 2000)

      // After 600ms
      vi.advanceTimersByTime(600)
      expect(await cache.get('short')).toBeUndefined()
      expect(await cache.get('long')).toBe(true)

      // After another 1500ms (total 2100ms)
      vi.advanceTimersByTime(1500)
      expect(await cache.get('long')).toBeUndefined()
    })

    it('should invalidate specific keys', async () => {
      const cache = createValidationCache()

      cache.set('key1', true)
      cache.set('key2', false)

      cache.invalidate('key1')

      expect(await cache.get('key1')).toBeUndefined()
      expect(await cache.get('key2')).toBe(false)
    })

    it('should clear all entries', async () => {
      const cache = createValidationCache()

      cache.set('key1', true)
      cache.set('key2', false)
      cache.set('key3', true)

      cache.clear()

      expect(await cache.get('key1')).toBeUndefined()
      expect(await cache.get('key2')).toBeUndefined()
      expect(await cache.get('key3')).toBeUndefined()
    })
  })

  describe('createCacheKey', () => {
    it('should create consistent keys', () => {
      const key1 = createCacheKey('step1', 'email', 'test@example.com')
      const key2 = createCacheKey('step1', 'email', 'test@example.com')

      expect(key1).toBe(key2)
    })

    it('should create different keys for different values', () => {
      const key1 = createCacheKey('step1', 'email', 'test1@example.com')
      const key2 = createCacheKey('step1', 'email', 'test2@example.com')

      expect(key1).not.toBe(key2)
    })

    it('should handle complex values', () => {
      const value = { nested: { field: 'value' }, array: [1, 2, 3] }
      const key = createCacheKey('step1', 'data', value)

      expect(key).toContain('step1')
      expect(key).toContain('data')
      expect(key).toContain('nested')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn(async (value: string) => value.toUpperCase())
      const debounced = debounce(fn, 100)

      debounced('test1')
      debounced('test2')
      const promise3 = debounced('test3')

      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('test3')

      const result = await promise3
      expect(result).toBe('TEST3')
    })

    it('should handle multiple debounce cycles', async () => {
      const fn = vi.fn(async (value: number) => value * 2)
      const debounced = debounce(fn, 100)

      // First cycle
      debounced(1)
      debounced(2)
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      // Second cycle
      debounced(3)
      debounced(4)
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenNthCalledWith(1, 2)
      expect(fn).toHaveBeenNthCalledWith(2, 4)
    })

    it('should cancel pending executions', async () => {
      const fn = vi.fn(async (value: string) => value)
      const debounced = debounce(fn, 100)

      debounced('test1')
      debounced('test2')

      debounced.cancel()

      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      expect(fn).not.toHaveBeenCalled()
    })

    it('should flush immediately', async () => {
      const fn = vi.fn(async (value: string) => value.toUpperCase())
      const debounced = debounce(fn, 100)

      debounced('test')

      const result = await debounced.flush()

      expect(result).toBe('TEST')
      expect(fn).toHaveBeenCalledTimes(1)

      // Timer should be canceled
      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()
      expect(fn).toHaveBeenCalledTimes(1) // Still only once
    })

    it('should handle errors in debounced function', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Test error')
      })
      const debounced = debounce(fn, 100)

      const promise = debounced().catch((error) => error)

      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      const error = await promise
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
    })
  })

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn(async () => 'success')

      const result = await withRetry(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      vi.useRealTimers()

      let attempts = 0
      const fn = vi.fn(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })

      const result = await withRetry(fn, { maxAttempts: 3, delay: 10 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)

      vi.useFakeTimers()
    })

    it('should throw after max attempts', async () => {
      vi.useRealTimers()

      const fn = vi.fn(async () => {
        throw new Error('Permanent failure')
      })

      await expect(withRetry(fn, { maxAttempts: 3, delay: 10 })).rejects.toThrow(
        'Permanent failure'
      )

      expect(fn).toHaveBeenCalledTimes(3)

      vi.useFakeTimers()
    })

    it('should call onRetry callback', async () => {
      vi.useRealTimers()

      const onRetry = vi.fn()
      let attempts = 0

      const fn = async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Retry me')
        }
        return 'success'
      }

      await withRetry(fn, { maxAttempts: 3, delay: 10, onRetry })

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))

      vi.useFakeTimers()
    })

    it('should use exponential backoff by default', async () => {
      vi.useRealTimers()

      const timestamps: number[] = []
      const fn = vi.fn(async () => {
        timestamps.push(Date.now())
        throw new Error('Always fails')
      })

      await expect(
        withRetry(fn, { maxAttempts: 3, delay: 100, backoff: 'exponential' })
      ).rejects.toThrow()

      // Check that delays are exponential: 100ms, 200ms
      // Note: Using a small tolerance (5ms) since real timers aren't perfectly precise
      const t0 = timestamps[0] ?? 0
      const t1 = timestamps[1] ?? 0
      const t2 = timestamps[2] ?? 0
      const delay1 = t1 - t0
      const delay2 = t2 - t1

      expect(delay1).toBeGreaterThanOrEqual(95) // 100ms - 5ms tolerance
      expect(delay1).toBeLessThan(150)
      expect(delay2).toBeGreaterThanOrEqual(195) // 200ms - 5ms tolerance
      expect(delay2).toBeLessThan(250)

      vi.useFakeTimers()
    })

    it('should use linear backoff when specified', async () => {
      vi.useRealTimers()

      const timestamps: number[] = []
      const fn = vi.fn(async () => {
        timestamps.push(Date.now())
        throw new Error('Always fails')
      })

      await expect(
        withRetry(fn, { maxAttempts: 3, delay: 100, backoff: 'linear' })
      ).rejects.toThrow()

      // Check that delays are linear: 100ms, 200ms
      // Note: Using a small tolerance (5ms) since real timers aren't perfectly precise
      const t0 = timestamps[0] ?? 0
      const t1 = timestamps[1] ?? 0
      const t2 = timestamps[2] ?? 0
      const delay1 = t1 - t0
      const delay2 = t2 - t1

      expect(delay1).toBeGreaterThanOrEqual(95) // 100ms - 5ms tolerance
      expect(delay1).toBeLessThan(150)
      expect(delay2).toBeGreaterThanOrEqual(195) // 200ms - 5ms tolerance
      expect(delay2).toBeLessThan(250)

      vi.useFakeTimers()
    })
  })

  describe('createAbortableValidation', () => {
    it('should allow aborting validation', async () => {
      vi.useRealTimers()

      const validationFn = vi.fn(async (signal: AbortSignal) => {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 1000)

          signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new Error('Aborted'))
          })
        })
        return 'completed'
      })

      const abortable = createAbortableValidation(validationFn)

      // Abort immediately
      abortable.abort()

      await expect(abortable.promise).rejects.toThrow('Aborted')

      vi.useFakeTimers()
    })

    it('should complete successfully if not aborted', async () => {
      vi.useRealTimers()

      const validationFn = vi.fn(async (_signal: AbortSignal) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'completed'
      })

      const abortable = createAbortableValidation(validationFn)

      const result = await abortable.promise

      expect(result).toBe('completed')

      vi.useFakeTimers()
    })

    it('should handle signal in custom validation', async () => {
      vi.useRealTimers()

      const validationFn = async (signal: AbortSignal) => {
        for (let i = 0; i < 5; i++) {
          if (signal.aborted) {
            throw new Error('Validation aborted')
          }
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
        return 'completed'
      }

      const abortable = createAbortableValidation(validationFn)

      // Abort after some time
      setTimeout(() => abortable.abort(), 25)

      await expect(abortable.promise).rejects.toThrow('Validation aborted')

      vi.useFakeTimers()
    })
  })

  describe('Integration scenarios', () => {
    it('should work with debounced validation and cache', async () => {
      const cache = createValidationCache()
      const validateFn = vi.fn(async (email: string) => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return email.includes('@')
      })

      const debouncedValidate = debounce(validateFn, 100)

      // First validation
      const key1 = createCacheKey('step1', 'email', 'test@example.com')
      const promise1 = debouncedValidate('test@example.com')

      vi.advanceTimersByTime(100)
      await vi.runAllTimersAsync()

      const result1 = await promise1
      cache.set(key1, result1)

      expect(result1).toBe(true)

      // Check cache
      expect(await cache.get(key1)).toBe(true)

      // Second validation with same value should use cache
      const cachedResult = await cache.get(key1)
      expect(cachedResult).toBe(true)
      expect(validateFn).toHaveBeenCalledTimes(1) // Not called again
    })

    it('should combine retry with abort', async () => {
      vi.useRealTimers()

      let attempts = 0
      const validateFn = async (signal: AbortSignal) => {
        attempts++
        if (signal.aborted) {
          throw new Error('Aborted')
        }
        if (attempts < 2) {
          throw new Error('Temporary failure')
        }
        return 'success'
      }

      const abortable = createAbortableValidation((signal) =>
        withRetry(
          async () => {
            if (signal.aborted) throw new Error('Aborted')
            return await validateFn(signal)
          },
          { maxAttempts: 3, delay: 10 }
        )
      )

      const result = await abortable.promise

      expect(result).toBe('success')
      expect(attempts).toBe(2)

      vi.useFakeTimers()
    })
  })
})
