import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isExpired, unwrapIfNotExpired, wrapWithTimestamp } from './ttl'

describe('TTL utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isExpired', () => {
    it('should return false when ttl is 0 (no expiration)', () => {
      const timestamp = Date.now()
      expect(isExpired(timestamp, 0)).toBe(false)
    })

    it('should return false when ttl is negative (no expiration)', () => {
      const timestamp = Date.now()
      expect(isExpired(timestamp, -1)).toBe(false)
    })

    it('should return false when data is not expired', () => {
      const timestamp = Date.now()
      const ttl = 60000 // 1 minute

      // Advance time by 30 seconds (less than ttl)
      vi.advanceTimersByTime(30000)

      expect(isExpired(timestamp, ttl)).toBe(false)
    })

    it('should return true when data is expired', () => {
      const timestamp = Date.now()
      const ttl = 60000 // 1 minute

      // Advance time by 61 seconds (more than ttl)
      vi.advanceTimersByTime(61000)

      expect(isExpired(timestamp, ttl)).toBe(true)
    })

    it('should return true when exactly at expiration time', () => {
      const timestamp = Date.now()
      const ttl = 60000

      // Advance time exactly to expiration
      vi.advanceTimersByTime(60001)

      expect(isExpired(timestamp, ttl)).toBe(true)
    })
  })

  describe('wrapWithTimestamp', () => {
    it('should wrap data with current timestamp', () => {
      const now = 1000000
      vi.setSystemTime(now)

      const data = { foo: 'bar' }
      const wrapped = wrapWithTimestamp(data)

      expect(wrapped).toEqual({
        timestamp: now,
        data: { foo: 'bar' },
      })
    })

    it('should work with different data types', () => {
      const now = 1000000
      vi.setSystemTime(now)

      expect(wrapWithTimestamp('string')).toEqual({
        timestamp: now,
        data: 'string',
      })

      expect(wrapWithTimestamp(123)).toEqual({
        timestamp: now,
        data: 123,
      })

      expect(wrapWithTimestamp(null)).toEqual({
        timestamp: now,
        data: null,
      })
    })
  })

  describe('unwrapIfNotExpired', () => {
    it('should return data if not expired', () => {
      const timestamp = Date.now()
      const data = { foo: 'bar' }
      const wrapped = { timestamp, data }
      const ttl = 60000

      // Advance time by 30 seconds (not expired)
      vi.advanceTimersByTime(30000)

      const result = unwrapIfNotExpired(wrapped, ttl)
      expect(result).toEqual(data)
    })

    it('should return null if expired', () => {
      const timestamp = Date.now()
      const data = { foo: 'bar' }
      const wrapped = { timestamp, data }
      const ttl = 60000

      // Advance time by 61 seconds (expired)
      vi.advanceTimersByTime(61000)

      const result = unwrapIfNotExpired(wrapped, ttl)
      expect(result).toBeNull()
    })

    it('should return data when ttl is 0 (no expiration)', () => {
      const timestamp = Date.now()
      const data = { foo: 'bar' }
      const wrapped = { timestamp, data }

      // Advance time significantly
      vi.advanceTimersByTime(1000000)

      const result = unwrapIfNotExpired(wrapped, 0)
      expect(result).toEqual(data)
    })
  })
})
