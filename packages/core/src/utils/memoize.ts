type MemoizeKey = string | number | symbol

/**
 * Options for memoization
 */
export interface MemoizeOptions<TArgs extends unknown[]> {
  /**
   * Custom function to generate cache key from arguments
   * Defaults to JSON.stringify
   */
  getKey?: (...args: TArgs) => MemoizeKey

  /**
   * Maximum number of cache entries
   * When exceeded, oldest entries are removed (LRU)
   */
  maxSize?: number

  /**
   * Time-to-live in milliseconds
   * Cached values expire after this duration
   */
  ttl?: number
}

/**
 * Cache entry with metadata
 */
interface CacheEntry<TReturn> {
  value: TReturn
  timestamp: number
  accessCount: number
}

/**
 * Memoizes a synchronous function
 * Caches results based on arguments to avoid redundant computations
 *
 * @example
 * ```ts
 * const expensive = (n: number) => {
 *   // Complex computation
 *   return n * n
 * }
 *
 * const memoized = memoize(expensive)
 * memoized(5) // Computed
 * memoized(5) // Cached
 * ```
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: MemoizeOptions<TArgs> = {}
): (...args: TArgs) => TReturn {
  const cache = new Map<MemoizeKey, CacheEntry<TReturn>>()
  const { getKey, maxSize, ttl } = options

  return (...args: TArgs): TReturn => {
    const key = getKey
      ? getKey(...args)
      : args
          .map((arg) =>
            arg === null ? 'null' : arg === undefined ? 'undefined' : JSON.stringify(arg)
          )
          .join('|')

    // Check if cached value exists and is valid
    if (cache.has(key)) {
      const entry = cache.get(key)
      if (entry) {
        // Check TTL
        if (ttl && Date.now() - entry.timestamp > ttl) {
          cache.delete(key)
        } else {
          entry.accessCount++
          return entry.value
        }
      }
    }

    // Compute new value
    const result = fn(...args)

    // Handle max size (LRU eviction)
    if (maxSize && cache.size >= maxSize) {
      // Find and remove least recently used entry
      let oldestKey: MemoizeKey | null = null
      let oldestTimestamp = Number.POSITIVE_INFINITY

      for (const [k, entry] of cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
          oldestKey = k
        }
      }

      if (oldestKey !== null) {
        cache.delete(oldestKey)
      }
    }

    // Store in cache
    cache.set(key, {
      value: result,
      timestamp: Date.now(),
      accessCount: 1,
    })

    return result
  }
}

/**
 * Memoizes an async function
 * Caches promises to avoid redundant async operations
 *
 * @example
 * ```ts
 * const fetchUser = async (id: number) => {
 *   const response = await fetch(`/api/users/${id}`)
 *   return response.json()
 * }
 *
 * const memoized = memoizeAsync(fetchUser)
 * await memoized(1) // Fetches
 * await memoized(1) // Cached
 * ```
 */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: MemoizeOptions<TArgs> = {}
): (...args: TArgs) => Promise<TReturn> {
  const cache = new Map<MemoizeKey, CacheEntry<Promise<TReturn>>>()
  const { getKey, maxSize, ttl } = options

  return async (...args: TArgs): Promise<TReturn> => {
    const key = getKey
      ? getKey(...args)
      : args
          .map((arg) =>
            arg === null ? 'null' : arg === undefined ? 'undefined' : JSON.stringify(arg)
          )
          .join('|')

    // Check if cached promise exists and is valid
    if (cache.has(key)) {
      const entry = cache.get(key)
      if (entry) {
        // Check TTL
        if (ttl && Date.now() - entry.timestamp > ttl) {
          cache.delete(key)
        } else {
          entry.accessCount++
          return entry.value
        }
      }
    }

    // Create new promise
    const promise = fn(...args)

    // Handle max size (LRU eviction)
    if (maxSize && cache.size >= maxSize) {
      let oldestKey: MemoizeKey | null = null
      let oldestTimestamp = Number.POSITIVE_INFINITY

      for (const [k, entry] of cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
          oldestKey = k
        }
      }

      if (oldestKey !== null) {
        cache.delete(oldestKey)
      }
    }

    // Store promise in cache
    cache.set(key, {
      value: promise,
      timestamp: Date.now(),
      accessCount: 1,
    })

    try {
      return await promise
    } catch (error) {
      // Remove failed promises from cache
      cache.delete(key)
      throw error
    }
  }
}

/**
 * Creates a memoized function with manual cache control
 * Returns both the memoized function and cache control methods
 *
 * @example
 * ```ts
 * const { fn: memoized, clear, has } = createMemoized(
 *   (x: number) => x * 2
 * )
 *
 * memoized(5) // Computed
 * memoized(5) // Cached
 * clear() // Clear cache
 * memoized(5) // Computed again
 * ```
 */
export function createMemoized<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: MemoizeOptions<TArgs> = {}
) {
  const cache = new Map<MemoizeKey, CacheEntry<TReturn>>()
  const { getKey, maxSize, ttl } = options

  const memoizedFn = (...args: TArgs): TReturn => {
    const key = getKey ? getKey(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      const entry = cache.get(key)

      if (entry) {
        if (ttl && Date.now() - entry.timestamp > ttl) {
          cache.delete(key)
        } else {
          entry.accessCount++
          return entry.value
        }
      }
    }

    const result = fn(...args)

    if (maxSize && cache.size >= maxSize) {
      let oldestKey: MemoizeKey | null = null
      let oldestTimestamp = Number.POSITIVE_INFINITY

      for (const [k, entry] of cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
          oldestKey = k
        }
      }

      if (oldestKey !== null) {
        cache.delete(oldestKey)
      }
    }

    cache.set(key, {
      value: result,
      timestamp: Date.now(),
      accessCount: 1,
    })

    return result
  }

  return {
    fn: memoizedFn,
    clear: () => cache.clear(),
    delete: (...args: TArgs) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args)
      return cache.delete(key)
    },
    has: (...args: TArgs) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args)
      return cache.has(key)
    },
    size: () => cache.size,
    stats: () => {
      const entries = Array.from(cache.values())
      return {
        size: cache.size,
        totalAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0),
        avgAccessCount:
          entries.length > 0
            ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
            : 0,
      }
    },
  }
}
