/**
 * Logger interface for formachine operations.
 * Allows customization of logging behavior in different environments.
 */
export interface FlowLogger {
  /**
   * Log a warning message
   * @param message - The warning message
   * @param context - Optional context information
   */
  warn(message: string, context?: Record<string, unknown>): void

  /**
   * Log an error message
   * @param message - The error message
   * @param context - Optional context information
   */
  error(message: string, context?: Record<string, unknown>): void
}

/**
 * Check if we're in development mode
 */
const isDevelopment = (): boolean => {
  try {
    // @ts-expect-error - process may not exist in browser
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
  } catch {
    return false
  }
}

/**
 * Default logger that only logs in development mode
 */
export const defaultLogger: FlowLogger = {
  warn: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment()) {
      console.warn(message, context || '')
    }
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(message, context || '')
  },
}

/**
 * No-op logger that doesn't log anything
 */
export const silentLogger: FlowLogger = {
  warn: () => {},
  error: () => {},
}
