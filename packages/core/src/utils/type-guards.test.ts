import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  assertNever,
  isDefined,
  isError,
  isFunction,
  isNumber,
  isObject,
  isString,
  isZodError,
} from './type-guards'

describe('type-guards', () => {
  describe('isZodError', () => {
    it('should return true for ZodError instances', () => {
      const schema = z.string()
      try {
        schema.parse(123)
      } catch (error) {
        expect(isZodError(error)).toBe(true)
      }
    })

    it('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isZodError(error)).toBe(false)
    })

    it('should return false for non-Error values', () => {
      expect(isZodError('string')).toBe(false)
      expect(isZodError(123)).toBe(false)
      expect(isZodError(null)).toBe(false)
      expect(isZodError(undefined)).toBe(false)
      expect(isZodError({})).toBe(false)
    })

    it('should narrow type correctly', () => {
      const schema = z.string()
      try {
        schema.parse(123)
      } catch (error) {
        if (isZodError(error)) {
          // Type should be narrowed to z.ZodError
          expect(error.issues).toBeDefined()
          expect(Array.isArray(error.issues)).toBe(true)
        }
      }
    })
  })

  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true)
      expect(isError(new TypeError('test'))).toBe(true)
      expect(isError(new RangeError('test'))).toBe(true)
    })

    it('should return true for ZodError', () => {
      const schema = z.string()
      try {
        schema.parse(123)
      } catch (error) {
        expect(isError(error)).toBe(true)
      }
    })

    it('should return false for non-Error values', () => {
      expect(isError('string')).toBe(false)
      expect(isError(123)).toBe(false)
      expect(isError(null)).toBe(false)
      expect(isError(undefined)).toBe(false)
      expect(isError({})).toBe(false)
    })

    it('should narrow type correctly', () => {
      const error = new Error('test')
      if (isError(error)) {
        // Type should be narrowed to Error
        expect(error.message).toBeDefined()
        expect(error.name).toBeDefined()
      }
    })
  })

  describe('assertNever', () => {
    it('should throw error when called', () => {
      expect(() => assertNever('unexpected' as never)).toThrow('Unexpected value: "unexpected"')
    })

    it('should include value in error message', () => {
      expect(() => assertNever({ key: 'value' } as never)).toThrow(
        'Unexpected value: {"key":"value"}'
      )
    })

    it('should be useful in exhaustive switch statements', () => {
      type Action = 'start' | 'stop'

      function handleAction(action: Action) {
        switch (action) {
          case 'start':
            return 'started'
          case 'stop':
            return 'stopped'
          default:
            return assertNever(action)
        }
      }

      expect(handleAction('start')).toBe('started')
      expect(handleAction('stop')).toBe('stopped')
    })
  })

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('string')).toBe(true)
      expect(isDefined(0)).toBe(true)
      expect(isDefined(false)).toBe(true)
      expect(isDefined({})).toBe(true)
      expect(isDefined([])).toBe(true)
    })

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false)
      expect(isDefined(undefined)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const value: string | null | undefined = 'test'
      if (isDefined(value)) {
        // Type should be narrowed to string
        expect(value.length).toBe(4)
      }
    })

    it('should work with arrays', () => {
      const arr = [1, 2, null, 3, undefined, 4]
      const filtered = arr.filter(isDefined)
      expect(filtered).toEqual([1, 2, 3, 4])
    })
  })

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString(String(123))).toBe(true)
    })

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString(true)).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
    })

    it('should narrow type correctly', () => {
      const value: unknown = 'test'
      if (isString(value)) {
        // Type should be narrowed to string
        expect(value.toUpperCase()).toBe('TEST')
      }
    })
  })

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(0)).toBe(true)
      expect(isNumber(123)).toBe(true)
      expect(isNumber(-456)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
      expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true)
    })

    it('should return false for NaN', () => {
      expect(isNumber(Number.NaN)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false)
      expect(isNumber(true)).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
      expect(isNumber({})).toBe(false)
    })

    it('should narrow type correctly', () => {
      const value: unknown = 42
      if (isNumber(value)) {
        // Type should be narrowed to number
        expect(value.toFixed(2)).toBe('42.00')
      }
    })
  })

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true)
      expect(isFunction(() => {})).toBe(true)
      expect(isFunction(async () => {})).toBe(true)
      expect(isFunction(Math.max)).toBe(true)
    })

    it('should return false for non-functions', () => {
      expect(isFunction('function')).toBe(false)
      expect(isFunction(123)).toBe(false)
      expect(isFunction(null)).toBe(false)
      expect(isFunction(undefined)).toBe(false)
      expect(isFunction({})).toBe(false)
      expect(isFunction([])).toBe(false)
    })

    it('should narrow type correctly', () => {
      const value: unknown = (x: number) => x * 2
      if (isFunction(value)) {
        // Type should be narrowed to function
        expect(value(5)).toBe(10)
      }
    })
  })

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
      expect(isObject(new Date())).toBe(true)
      expect(isObject(new Error())).toBe(true)
    })

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false)
    })

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false)
      expect(isObject([1, 2, 3])).toBe(false)
    })

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(true)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const value: unknown = { name: 'test' }
      if (isObject(value)) {
        // Type should be narrowed to Record<string, unknown>
        expect(value.name).toBe('test')
      }
    })
  })

  describe('type guards in combination', () => {
    it('should work together for complex type checking', () => {
      function processValue(value: unknown): string {
        if (isString(value)) {
          return value.toUpperCase()
        }
        if (isNumber(value)) {
          return value.toFixed(2)
        }
        if (isObject(value) && Object.hasOwn(value, 'toString')) {
          return String(value.toString)
        }
        return 'unknown'
      }

      expect(processValue('hello')).toBe('HELLO')
      expect(processValue(42)).toBe('42.00')
      expect(processValue({})).toBe('unknown')
    })

    it('should handle error type checking', () => {
      function handleError(error: unknown): string {
        if (isZodError(error)) {
          return `Zod validation failed: ${error.issues.length} issues`
        }
        if (isError(error)) {
          return `Error: ${error.message}`
        }
        return 'Unknown error'
      }

      expect(handleError(new Error('test'))).toBe('Error: test')

      const schema = z.string()
      try {
        schema.parse(123)
      } catch (error) {
        const result = handleError(error)
        expect(result).toContain('Zod validation failed')
      }
    })
  })
})
