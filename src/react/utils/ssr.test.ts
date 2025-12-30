import { describe, expect, it, vi } from 'vitest'
import { isClient, isServer, safeWindow } from './ssr'

describe('ssr utilities', () => {
  describe('isServer', () => {
    it('should return false in a browser environment', () => {
      expect(isServer()).toBe(false)
    })

    it('should return true when window is undefined', () => {
      const originalWindow = globalThis.window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).window

      expect(isServer()).toBe(true)

      // Restore window
      globalThis.window = originalWindow
    })
  })

  describe('isClient', () => {
    it('should return true in a browser environment', () => {
      expect(isClient()).toBe(true)
    })

    it('should return false when window is undefined', () => {
      const originalWindow = globalThis.window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).window

      expect(isClient()).toBe(false)

      // Restore window
      globalThis.window = originalWindow
    })
  })

  describe('safeWindow', () => {
    it('should execute callback with window in browser environment', () => {
      const callback = vi.fn((win: Window) => win.innerWidth)
      const result = safeWindow(callback, 0)

      expect(callback).toHaveBeenCalledWith(window)
      expect(result).toBe(window.innerWidth)
    })

    it('should return fallback when window is undefined', () => {
      const originalWindow = globalThis.window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).window

      const callback = vi.fn()
      const fallback = 123
      const result = safeWindow(callback, fallback)

      expect(callback).not.toHaveBeenCalled()
      expect(result).toBe(fallback)

      // Restore window
      globalThis.window = originalWindow
    })

    it('should work with different return types', () => {
      const stringResult = safeWindow((win) => win.location.href, 'fallback')
      expect(typeof stringResult).toBe('string')

      const numberResult = safeWindow((win) => win.innerHeight, 0)
      expect(typeof numberResult).toBe('number')

      const booleanResult = safeWindow((win) => !!win.navigator, false)
      expect(typeof booleanResult).toBe('boolean')
    })

    it('should handle complex fallback values', () => {
      const originalWindow = globalThis.window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).window

      const complexFallback = { width: 1024, height: 768 }
      const result = safeWindow(
        (win) => ({ width: win.innerWidth, height: win.innerHeight }),
        complexFallback
      )

      expect(result).toEqual(complexFallback)

      // Restore window
      globalThis.window = originalWindow
    })

    it('should pass window object to callback correctly', () => {
      const callback = vi.fn((win: Window) => {
        expect(win).toBe(window)
        return 'success'
      })

      safeWindow(callback, 'fallback')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('integration scenarios', () => {
    it('should allow checking environment and using safeWindow together', () => {
      if (isClient()) {
        const width = safeWindow((win) => win.innerWidth, 0)
        expect(width).toBeGreaterThanOrEqual(0)
      } else {
        const width = safeWindow((win) => win.innerWidth, 1024)
        expect(width).toBe(1024)
      }
    })

    it('isServer and isClient should be opposite', () => {
      expect(isServer()).toBe(!isClient())
    })
  })
})
