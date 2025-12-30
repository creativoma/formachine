import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { isZodError } from '../utils/type-guards'
import { createValidator, zodValidator } from './validator'

describe('zodValidator', () => {
  describe('parse', () => {
    it('should parse valid data asynchronously', async () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      const result = await validator.parse({ name: 'John' })
      expect(result).toEqual({ name: 'John' })
    })

    it('should throw on invalid data', async () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      await expect(validator.parse({ name: 123 })).rejects.toThrow()
    })

    it('should handle complex nested schemas', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
      })
      const validator = zodValidator(schema)

      const data = {
        user: { profile: { name: 'John', age: 30 } },
      }

      const result = await validator.parse(data)
      expect(result).toEqual(data)
    })

    it('should handle schema transformations', async () => {
      const schema = z.object({
        age: z.string().transform((val) => Number.parseInt(val, 10)),
      })
      const validator = zodValidator(schema)

      const result = await validator.parse({ age: '25' })
      expect(result).toEqual({ age: 25 })
    })
  })

  describe('safeParse', () => {
    it('should return success result for valid data', async () => {
      const schema = z.object({ email: z.string().email() })
      const validator = zodValidator(schema)

      const result = await validator.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ email: 'test@example.com' })
      }
    })

    it('should return error result for invalid data', async () => {
      const schema = z.object({ email: z.string().email() })
      const validator = zodValidator(schema)

      const result = await validator.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
      if (!result.success && result.errors && isZodError(result.errors)) {
        expect(result.errors).toBeInstanceOf(z.ZodError)
        expect(result.errors.issues).toHaveLength(1)
      }
    })

    it('should handle async refinements', async () => {
      const checkEmailUnique = async (email: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return email !== 'taken@example.com'
      }

      const schema = z
        .object({ email: z.string().email() })
        .refine(async (data) => await checkEmailUnique(data.email), {
          message: 'Email already taken',
        })
      const validator = zodValidator(schema)

      const result = await validator.safeParse({ email: 'taken@example.com' })
      expect(result.success).toBe(false)
    })

    it('should handle multiple validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        age: z.number().min(18),
      })
      const validator = zodValidator(schema)

      const result = await validator.safeParse({
        name: 'Jo',
        email: 'invalid',
        age: 15,
      })

      expect(result.success).toBe(false)
      if (!result.success && result.errors && isZodError(result.errors)) {
        expect(result.errors.issues).toHaveLength(3)
      }
    })
  })

  describe('parseSync', () => {
    it('should parse valid data synchronously', () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      const result = validator.parseSync?.({ name: 'John' })
      expect(result).toEqual({ name: 'John' })
    })

    it('should throw on invalid data', () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      expect(() => validator.parseSync?.({ name: 123 })).toThrow()
    })

    it('should handle transformations', () => {
      const schema = z.object({
        value: z.string().transform((v) => v.toUpperCase()),
      })
      const validator = zodValidator(schema)

      const result = validator.parseSync?.({ value: 'hello' })
      expect(result).toEqual({ value: 'HELLO' })
    })

    it('should handle optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      })
      const validator = zodValidator(schema)

      const result = validator.parseSync?.({ required: 'test' })
      expect(result).toEqual({ required: 'test' })
    })
  })

  describe('safeParseSync', () => {
    it('should return success result for valid data', () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      const result = validator.safeParseSync?.({ name: 'John' })
      expect(result?.success).toBe(true)
      if (result?.success) {
        expect(result.data).toEqual({ name: 'John' })
      }
    })

    it('should return error result for invalid data', () => {
      const schema = z.object({ name: z.string() })
      const validator = zodValidator(schema)

      const result = validator.safeParseSync?.({ name: 123 })
      expect(result?.success).toBe(false)
      if (result && !result.success) {
        expect(result.errors).toBeInstanceOf(z.ZodError)
      }
    })

    it('should handle default values', () => {
      const schema = z.object({
        name: z.string(),
        active: z.boolean().default(true),
      })
      const validator = zodValidator(schema)

      const result = validator.safeParseSync?.({ name: 'John' })
      expect(result?.success).toBe(true)
      if (result?.success) {
        expect(result.data).toEqual({ name: 'John', active: true })
      }
    })

    it('should validate arrays', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      })
      const validator = zodValidator(schema)

      const result = validator.safeParseSync?.({ tags: ['a', 'b', 'c'] })
      expect(result?.success).toBe(true)
      if (result?.success && result.data) {
        expect(result.data.tags).toHaveLength(3)
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty objects', async () => {
      const schema = z.object({})
      const validator = zodValidator(schema)

      const result = await validator.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should handle strict mode schemas', async () => {
      const schema = z.object({ name: z.string() }).strict()
      const validator = zodValidator(schema)

      const result = await validator.safeParse({ name: 'John', extra: 'field' })
      expect(result.success).toBe(false)
    })

    it('should handle discriminated unions', async () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('text'), value: z.string() }),
        z.object({ type: z.literal('number'), value: z.number() }),
      ])
      const validator = zodValidator(schema)

      const result1 = await validator.safeParse({ type: 'text', value: 'hello' })
      expect(result1.success).toBe(true)

      const result2 = await validator.safeParse({ type: 'number', value: 42 })
      expect(result2.success).toBe(true)

      const result3 = await validator.safeParse({ type: 'text', value: 123 })
      expect(result3.success).toBe(false)
    })

    it('should handle recursive schemas', async () => {
      type Category = {
        name: string
        subcategories?: Category[]
      }

      const categorySchema: z.ZodType<Category> = z.lazy(() =>
        z.object({
          name: z.string(),
          subcategories: z.array(categorySchema).optional(),
        })
      )

      const validator = zodValidator(categorySchema)

      const data = {
        name: 'Root',
        subcategories: [
          { name: 'Child 1' },
          { name: 'Child 2', subcategories: [{ name: 'Grandchild' }] },
        ],
      }

      const result = await validator.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should handle passthrough schemas', async () => {
      const schema = z.object({ name: z.string() }).passthrough()
      const validator = zodValidator(schema)

      const result = await validator.safeParse({
        name: 'John',
        extra: 'field',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ name: 'John', extra: 'field' })
      }
    })
  })
})

describe('createValidator', () => {
  describe('parse', () => {
    it('should call custom validate function', async () => {
      const validate = vi.fn(async (data: { value: number }) => data.value * 2)
      const validator = createValidator({ validate })

      const result = await validator.parse({ value: 5 })
      expect(validate).toHaveBeenCalledWith({ value: 5 })
      expect(result).toBe(10)
    })

    it('should handle synchronous validate functions', async () => {
      const validate = (data: { value: number }) => data.value * 2
      const validator = createValidator({ validate })

      const result = await validator.parse({ value: 5 })
      expect(result).toBe(10)
    })

    it('should propagate errors from validate function', async () => {
      const validate = async () => {
        throw new Error('Custom validation error')
      }
      const validator = createValidator({ validate })

      await expect(validator.parse({ value: 5 })).rejects.toThrow('Custom validation error')
    })
  })

  describe('safeParse', () => {
    it('should return success for valid data', async () => {
      const validate = async (data: { email: string }) => {
        if (!data.email.includes('@')) {
          throw new Error('Invalid email')
        }
        return data.email
      }
      const validator = createValidator({ validate })

      const result = await validator.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should catch errors and return error result', async () => {
      const validate = async (data: { email: string }) => {
        if (!data.email.includes('@')) {
          throw new Error('Invalid email')
        }
        return data.email
      }
      const validator = createValidator({ validate })

      const result = await validator.safeParse({ email: 'invalid' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(Error)
      }
    })

    it('should handle async validation with delays', async () => {
      const validate = async (data: { username: string }) => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        if (data.username === 'admin') {
          throw new Error('Username taken')
        }
        return data.username
      }
      const validator = createValidator({ validate })

      const result1 = await validator.safeParse({ username: 'admin' })
      expect(result1.success).toBe(false)

      const result2 = await validator.safeParse({ username: 'user123' })
      expect(result2.success).toBe(true)
    })
  })

  describe('parseSync', () => {
    it('should use validateSync when provided', () => {
      const validate = async (data: { value: number }) => data.value * 2
      const validateSync = (data: { value: number }) => data.value * 2
      const validator = createValidator({ validate, validateSync })

      const result = validator.parseSync?.({ value: 5 })
      expect(result).toBe(10)
    })

    it('should be undefined when validateSync not provided', () => {
      const validate = async (data: { value: number }) => data.value * 2
      const validator = createValidator({ validate })

      expect(validator.parseSync).toBeUndefined()
    })

    it('should throw errors from validateSync', () => {
      const validate = async () => 0
      const validateSync = () => {
        throw new Error('Sync validation failed')
      }
      const validator = createValidator({ validate, validateSync })

      expect(() => validator.parseSync?.({})).toThrow('Sync validation failed')
    })
  })

  describe('safeParseSync', () => {
    it('should return success for valid data', () => {
      const validate = async (data: { value: number }) => data.value * 2
      const validateSync = (data: { value: number }) => data.value * 2
      const validator = createValidator({ validate, validateSync })

      const result = validator.safeParseSync?.({ value: 5 })
      expect(result?.success).toBe(true)
      if (result?.success) {
        expect(result.data).toBe(10)
      }
    })

    it('should catch errors and return error result', () => {
      const validate = async () => 0
      const validateSync = (data: { value: number }) => {
        if (data.value < 0) {
          throw new Error('Negative value')
        }
        return data.value
      }
      const validator = createValidator({ validate, validateSync })

      const result = validator.safeParseSync?.({ value: -5 })
      expect(result?.success).toBe(false)
      if (result && !result.success) {
        expect(result.errors).toBeInstanceOf(Error)
      }
    })

    it('should be undefined when validateSync not provided', () => {
      const validate = async (data: { value: number }) => data.value
      const validator = createValidator({ validate })

      expect(validator.safeParseSync).toBeUndefined()
    })
  })

  describe('custom validation logic', () => {
    it('should support complex custom validation', async () => {
      interface FormData {
        password: string
        confirmPassword: string
      }

      const validate = async (data: FormData) => {
        if (data.password !== data.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        if (data.password.length < 8) {
          throw new Error('Password too short')
        }
        return data
      }

      const validator = createValidator({ validate })

      const result1 = await validator.safeParse({
        password: 'short',
        confirmPassword: 'short',
      })
      expect(result1.success).toBe(false)

      const result2 = await validator.safeParse({
        password: 'longpassword',
        confirmPassword: 'different',
      })
      expect(result2.success).toBe(false)

      const result3 = await validator.safeParse({
        password: 'longpassword',
        confirmPassword: 'longpassword',
      })
      expect(result3.success).toBe(true)
    })

    it('should support data transformation', async () => {
      const validate = async (data: { name: string }) => {
        return {
          name: data.name.trim().toUpperCase(),
          processedAt: new Date(),
        }
      }

      const validator = createValidator({ validate })

      const result = await validator.safeParse({ name: '  john doe  ' })
      expect(result.success).toBe(true)
      if (result.success && result.data) {
        expect(result.data.name).toBe('JOHN DOE')
        expect(result.data.processedAt).toBeInstanceOf(Date)
      }
    })

    it('should support conditional validation', async () => {
      interface UserData {
        userType: 'individual' | 'business'
        ssn?: string
        ein?: string
      }

      const validate = async (data: UserData) => {
        if (data.userType === 'individual' && !data.ssn) {
          throw new Error('SSN required for individual')
        }
        if (data.userType === 'business' && !data.ein) {
          throw new Error('EIN required for business')
        }
        return data
      }

      const validator = createValidator({ validate })

      const result1 = await validator.safeParse({
        userType: 'individual' as const,
      })
      expect(result1.success).toBe(false)

      const result2 = await validator.safeParse({
        userType: 'individual' as const,
        ssn: '123-45-6789',
      })
      expect(result2.success).toBe(true)

      const result3 = await validator.safeParse({
        userType: 'business' as const,
        ein: '12-3456789',
      })
      expect(result3.success).toBe(true)
    })
  })
})
