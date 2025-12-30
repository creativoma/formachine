import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from './create'

describe('createFormFlow', () => {
  const testFlow = createFormFlow({
    id: 'test-flow',
    steps: {
      account: {
        schema: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
        next: 'profile',
      },
      profile: {
        schema: z.object({
          name: z.string().min(2),
          accountType: z.enum(['personal', 'business']),
        }),
        next: (data: { name: string; accountType: 'personal' | 'business' }) =>
          data.accountType === 'business' ? 'company' : 'complete',
      },
      company: {
        schema: z.object({
          companyName: z.string(),
        }),
        next: 'complete',
      },
      complete: {
        schema: z.object({
          newsletter: z.boolean(),
        }),
        next: null,
      },
    },
    initial: 'account',
  })

  describe('getInitialState', () => {
    it('should return correct initial state', () => {
      const state = testFlow.getInitialState()

      expect(state.currentStep).toBe('account')
      expect(state.data).toEqual({})
      expect(state.completedSteps.size).toBe(0)
      expect(state.path).toEqual(['account'])
      expect(state.history).toEqual(['account'])
      expect(state.status).toBe('idle')
    })
  })

  describe('calculatePath', () => {
    it('should calculate path for personal account', () => {
      const path = testFlow.calculatePath({
        account: { email: 'test@example.com', password: 'password123' },
        profile: { name: 'John', accountType: 'personal' },
      })

      expect(path).toEqual(['account', 'profile', 'complete'])
    })

    it('should calculate path for business account', () => {
      const path = testFlow.calculatePath({
        account: { email: 'test@example.com', password: 'password123' },
        profile: { name: 'John', accountType: 'business' },
      })

      expect(path).toEqual(['account', 'profile', 'company'])
    })
  })

  describe('getStepSchema', () => {
    it('should return the schema for a step', () => {
      const schema = testFlow.getStepSchema('account')

      expect(schema).toBeDefined()

      const validResult = schema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(validResult.success).toBe(true)

      const invalidResult = schema.safeParse({
        email: 'invalid',
        password: 'short',
      })
      expect(invalidResult.success).toBe(false)
    })
  })
})
