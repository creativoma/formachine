import { describe, expect, it, vi } from 'vitest'
import { createMemoized, memoize, memoizeAsync } from './memoize'

describe('memoize', () => {
  it('should cache function results', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn)

    expect(memoized(5)).toBe(10)
    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should compute different results for different arguments', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn)

    expect(memoized(5)).toBe(10)
    expect(memoized(10)).toBe(20)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple arguments', () => {
    const fn = vi.fn((x: number, y: number) => x + y)
    const memoized = memoize(fn)

    expect(memoized(5, 10)).toBe(15)
    expect(memoized(5, 10)).toBe(15)
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized(5, 20)).toBe(25)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should use custom key function', () => {
    const fn = vi.fn((obj: { id: number; name: string }) => obj.name.toUpperCase())
    const memoized = memoize(fn, {
      getKey: (obj) => obj.id,
    })

    expect(memoized({ id: 1, name: 'john' })).toBe('JOHN')
    expect(memoized({ id: 1, name: 'jane' })).toBe('JOHN') // Same ID, cached
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized({ id: 2, name: 'jane' })).toBe('JANE')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should respect maxSize option', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn, { maxSize: 2 })

    memoized(1) // Cache: [1]
    memoized(2) // Cache: [1, 2]
    memoized(3) // Cache: [2, 3] (1 evicted)

    expect(fn).toHaveBeenCalledTimes(3)

    memoized(2) // Cached
    expect(fn).toHaveBeenCalledTimes(3)

    memoized(1) // Not cached (was evicted)
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('should respect TTL option', async () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn, { ttl: 100 })

    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)

    // Within TTL
    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(2) // Recomputed
  })

  it('should handle complex objects', () => {
    const fn = vi.fn((obj: { a: number; b: { c: string } }) => obj.a + obj.b.c.length)
    const memoized = memoize(fn)

    const input = { a: 5, b: { c: 'hello' } }
    expect(memoized(input)).toBe(10)
    expect(memoized(input)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('memoizeAsync', () => {
  it('should cache async function results', async () => {
    const fn = vi.fn(async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return x * 2
    })
    const memoized = memoizeAsync(fn)

    expect(await memoized(5)).toBe(10)
    expect(await memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should handle concurrent calls with same arguments', async () => {
    const fn = vi.fn(async (x: number) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return x * 2
    })
    const memoized = memoizeAsync(fn)

    const [result1, result2, result3] = await Promise.all([memoized(5), memoized(5), memoized(5)])

    expect(result1).toBe(10)
    expect(result2).toBe(10)
    expect(result3).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1) // Only called once
  })

  it('should remove failed promises from cache', async () => {
    let callCount = 0
    const fn = vi.fn(async (x: number) => {
      callCount++
      if (callCount === 1) {
        throw new Error('First call fails')
      }
      return x * 2
    })
    const memoized = memoizeAsync(fn)

    await expect(memoized(5)).rejects.toThrow('First call fails')
    expect(await memoized(5)).toBe(10) // Should retry, not use cached error
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should respect TTL for async functions', async () => {
    const fn = vi.fn(async (x: number) => x * 2)
    const memoized = memoizeAsync(fn, { ttl: 100 })

    expect(await memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)

    // Within TTL
    expect(await memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(1)

    // Wait for TTL
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(await memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should respect maxSize for async functions', async () => {
    const fn = vi.fn(async (x: number) => x * 2)
    const memoized = memoizeAsync(fn, { maxSize: 2 })

    await memoized(1)
    await memoized(2)
    await memoized(3) // Evicts 1

    expect(fn).toHaveBeenCalledTimes(3)

    await memoized(2) // Cached
    expect(fn).toHaveBeenCalledTimes(3)

    await memoized(1) // Not cached
    expect(fn).toHaveBeenCalledTimes(4)
  })
})

describe('createMemoized', () => {
  it('should return memoized function with cache control', () => {
    const fn = vi.fn((x: number) => x * 2)
    const { fn: memoized, clear, has, size } = createMemoized(fn)

    expect(memoized(5)).toBe(10)
    expect(has(5)).toBe(true)
    expect(size()).toBe(1)

    clear()
    expect(has(5)).toBe(false)
    expect(size()).toBe(0)

    expect(memoized(5)).toBe(10)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should allow deleting specific cache entries', () => {
    const fn = vi.fn((x: number) => x * 2)
    const { fn: memoized, delete: del } = createMemoized(fn)

    memoized(5)
    memoized(10)

    expect(fn).toHaveBeenCalledTimes(2)

    del(5)

    memoized(5) // Recomputed
    memoized(10) // Cached

    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('should provide cache statistics', () => {
    const fn = vi.fn((x: number) => x * 2)
    const { fn: memoized, stats } = createMemoized(fn)

    memoized(5)
    memoized(5)
    memoized(10)
    memoized(10)
    memoized(10)

    const statistics = stats()

    expect(statistics.size).toBe(2)
    expect(statistics.totalAccessCount).toBe(5)
    expect(statistics.avgAccessCount).toBe(2.5)
  })

  it('should work with custom key function', () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 2)
    const { fn: memoized, has } = createMemoized(fn, {
      getKey: (obj) => obj.id,
    })

    memoized({ id: 1 })

    expect(has({ id: 1 })).toBe(true)
    expect(has({ id: 2 })).toBe(false)
  })

  it('should handle maxSize with cache control', () => {
    const fn = vi.fn((x: number) => x * 2)
    const { fn: memoized, size } = createMemoized(fn, { maxSize: 2 })

    memoized(1)
    memoized(2)
    expect(size()).toBe(2)

    memoized(3)
    expect(size()).toBe(2) // Still 2 due to maxSize
  })
})

describe('edge cases', () => {
  it('should handle functions with no arguments', () => {
    const fn = vi.fn(() => Math.random())
    const memoized = memoize(fn)

    const result1 = memoized()
    const result2 = memoized()

    expect(result1).toBe(result2)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should handle undefined and null arguments', () => {
    const fn = vi.fn((x: any) => String(x))
    const memoized = memoize(fn)

    expect(memoized(undefined)).toBe('undefined')
    expect(memoized(undefined)).toBe('undefined')
    expect(fn).toHaveBeenCalledTimes(1)

    expect(memoized(null)).toBe('null')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should distinguish between similar but different arguments', () => {
    const fn = vi.fn((x: any) => JSON.stringify(x))
    const memoized = memoize(fn)

    memoized([1, 2])
    memoized([1, 2, 3])
    memoized({ a: 1 })
    memoized({ a: 1, b: 2 })

    expect(fn).toHaveBeenCalledTimes(4)
  })

  it('should handle functions that return undefined', () => {
    const fn = vi.fn(() => undefined)
    const memoized = memoize(fn)

    expect(memoized()).toBeUndefined()
    expect(memoized()).toBeUndefined()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should handle very large cache sizes', () => {
    const fn = vi.fn((x: number) => x * 2)
    const memoized = memoize(fn, { maxSize: 1000 })

    for (let i = 0; i < 1500; i++) {
      memoized(i)
    }

    expect(fn).toHaveBeenCalledTimes(1500)

    // First 500 should be evicted
    memoized(0)
    expect(fn).toHaveBeenCalledTimes(1501)

    // Last 500 should be cached
    memoized(1499)
    expect(fn).toHaveBeenCalledTimes(1501)
  })
})
