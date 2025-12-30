export interface AsyncValidationCache {
  get(key: string): Promise<boolean | undefined>
  set(key: string, value: boolean, ttl?: number): void
  invalidate(key: string): void
  clear(): void
}

interface CacheEntry {
  value: boolean
  expires: number
}

export function createValidationCache(defaultTtl = 60000): AsyncValidationCache {
  const cache = new Map<string, CacheEntry>()

  return {
    async get(key: string): Promise<boolean | undefined> {
      const entry = cache.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expires) {
        cache.delete(key)
        return undefined
      }
      return entry.value
    },

    set(key: string, value: boolean, ttl = defaultTtl): void {
      cache.set(key, { value, expires: Date.now() + ttl })
    },

    invalidate(key: string): void {
      cache.delete(key)
    },

    clear(): void {
      cache.clear()
    },
  }
}

export function createCacheKey(stepId: string, fieldPath: string, value: unknown): string {
  return `${stepId}:${fieldPath}:${JSON.stringify(value)}`
}

// Debounced validation
type AnyFunction = (...args: never[]) => unknown

export interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>>
  cancel: () => void
  flush: () => Promise<Awaited<ReturnType<T>> | undefined>
}

export function debounce<T extends AnyFunction>(fn: T, delay: number): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: ((value: Awaited<ReturnType<T>>) => void) | null = null
  let pendingReject: ((error: unknown) => void) | null = null
  let lastArgs: Parameters<T> | null = null

  const debounced = (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    lastArgs = args

    return new Promise((resolve, reject) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      pendingResolve = resolve
      pendingReject = reject

      timeoutId = setTimeout(async () => {
        timeoutId = null
        try {
          const result = (await fn(...args)) as Awaited<ReturnType<T>>
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    pendingResolve = null
    pendingReject = null
    lastArgs = null
  }

  debounced.flush = async (): Promise<Awaited<ReturnType<T>> | undefined> => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (lastArgs !== null && pendingResolve !== null) {
      try {
        const result = (await fn(...lastArgs)) as Awaited<ReturnType<T>>
        pendingResolve(result)
        return result
      } catch (error) {
        if (pendingReject) {
          pendingReject(error)
        }
        throw error
      } finally {
        pendingResolve = null
        pendingReject = null
        lastArgs = null
      }
    }

    return undefined
  }

  return debounced
}

// Retry logic for async operations
export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 'exponential', onRetry } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxAttempts) {
        throw lastError
      }

      if (onRetry) {
        onRetry(attempt, lastError)
      }

      const waitTime = backoff === 'exponential' ? delay * 2 ** (attempt - 1) : delay * attempt
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  // This will never be reached because maxAttempts is always >= 1
  // biome-ignore lint/style/noNonNullAssertion: lastError is guaranteed to be assigned in the loop above
  throw lastError!
}

// Abortable async validation
export interface AbortableValidation<T> {
  promise: Promise<T>
  abort: () => void
}

export function createAbortableValidation<T>(
  validationFn: (signal: AbortSignal) => Promise<T>
): AbortableValidation<T> {
  const controller = new AbortController()

  return {
    promise: validationFn(controller.signal),
    abort: () => controller.abort(),
  }
}
