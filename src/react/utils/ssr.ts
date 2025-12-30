/**
 * Check if code is running in a server-side rendering environment
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if code is running in a client environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Safely access window object with SSR fallback
 *
 * @param callback - Function to execute with window object
 * @param fallback - Value to return if running in SSR
 * @returns The result of callback or fallback value
 *
 * @example
 * ```ts
 * const width = safeWindow((win) => win.innerWidth, 0)
 * ```
 */
export function safeWindow<T>(callback: (window: Window) => T, fallback: T): T {
  if (isServer()) {
    return fallback
  }
  return callback(window)
}
