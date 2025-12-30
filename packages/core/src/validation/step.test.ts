import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validateStep, validateStepSync } from './step'

describe('validateStep', () => {
  const schema = z.object({
    email: z.string().email(),
    age: z.number().min(18),
  })

  it('should return success for valid data', async () => {
    const result = await validateStep(schema, {
      email: 'test@example.com',
      age: 25,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      email: 'test@example.com',
      age: 25,
    })
    expect(result.errors).toBeUndefined()
  })

  it('should return errors for invalid data', async () => {
    const result = await validateStep(schema, {
      email: 'invalid',
      age: 15,
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
    expect(result.errors).toBeDefined()
    expect(result.errors?.issues).toHaveLength(2)
  })

  it('should handle async refinements', async () => {
    const asyncSchema = z.object({
      username: z.string().refine(
        async (val) => {
          // Simulate async validation
          await new Promise((r) => setTimeout(r, 10))
          return val !== 'taken'
        },
        { message: 'Username is taken' }
      ),
    })

    const validResult = await validateStep(asyncSchema, { username: 'available' })
    expect(validResult.success).toBe(true)

    const invalidResult = await validateStep(asyncSchema, { username: 'taken' })
    expect(invalidResult.success).toBe(false)
  })
})

describe('validateStepSync', () => {
  const schema = z.object({
    name: z.string().min(2),
  })

  it('should validate synchronously', () => {
    const validResult = validateStepSync(schema, { name: 'John' })
    expect(validResult.success).toBe(true)
    expect(validResult.data).toEqual({ name: 'John' })

    const invalidResult = validateStepSync(schema, { name: 'J' })
    expect(invalidResult.success).toBe(false)
  })
})
