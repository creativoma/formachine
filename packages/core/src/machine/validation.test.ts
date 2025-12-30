import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  assertValidFlow,
  type FormFlowDefinition,
  getFlowWarnings,
  validateFlowDefinition,
} from './validation'

describe('validateFlowDefinition', () => {
  it('should pass validation for a valid simple flow', () => {
    const definition: FormFlowDefinition<'step1' | 'step2', any> = {
      initial: 'step1',
      steps: {
        step1: { schema: z.object({}), next: 'step2' },
        step2: { schema: z.object({}) },
      },
    }

    const errors = validateFlowDefinition(definition)
    expect(errors).toHaveLength(0)
  })

  it('should pass validation for a valid multi-step flow', () => {
    const definition: FormFlowDefinition<'step1' | 'step2' | 'step3', any> = {
      initial: 'step1',
      steps: {
        step1: { schema: z.object({}), next: 'step2' },
        step2: { schema: z.object({}), next: 'step3' },
        step3: { schema: z.object({}) },
      },
    }

    const errors = validateFlowDefinition(definition)
    expect(errors).toHaveLength(0)
  })

  describe('missing_step errors', () => {
    it('should detect missing initial step', () => {
      const definition = {
        initial: 'nonexistent' as any,
        steps: {
          step1: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_step',
          step: 'nonexistent',
          message: expect.stringContaining('Initial step "nonexistent" not found'),
        })
      )
    })
  })

  describe('invalid_next errors', () => {
    it('should detect invalid next step reference', () => {
      const definition: FormFlowDefinition<'step1', any> = {
        initial: 'step1',
        steps: {
          step1: { schema: z.object({}), next: 'nonexistent' as any },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'invalid_next',
          step: 'step1',
          message: expect.stringContaining('references non-existent next step'),
        })
      )
    })

    it('should detect multiple invalid next references', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'invalid1' as any },
          step2: { schema: z.object({}), next: 'invalid2' as any },
        },
      }

      const errors = validateFlowDefinition(definition)
      const invalidNextErrors = errors.filter((e) => e.type === 'invalid_next')
      expect(invalidNextErrors).toHaveLength(2)
    })
  })

  describe('infinite_loop detection', () => {
    it('should detect simple two-step loop', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step2' as const },
          step2: { schema: z.object({}), next: 'step1' as const },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'infinite_loop',
          message: expect.stringContaining('Infinite loop detected'),
        })
      )
    })

    it('should detect self-referencing loop', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step1' as const },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'infinite_loop',
          path: expect.arrayContaining(['step1']),
        })
      )
    })

    it('should detect complex multi-step loop', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step2' as const },
          step2: { schema: z.object({}), next: 'step3' as const },
          step3: { schema: z.object({}), next: 'step1' as const },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'infinite_loop',
        })
      )
    })

    it('should not flag valid linear flow as loop', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step2' as const },
          step2: { schema: z.object({}), next: 'step3' as const },
          step3: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      const loopErrors = errors.filter((e) => e.type === 'infinite_loop')
      expect(loopErrors).toHaveLength(0)
    })
  })

  describe('missing_schema errors', () => {
    it('should detect missing schema', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { next: 'step2' as const } as any,
          step2: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'missing_schema',
          step: 'step1',
          message: expect.stringContaining('missing a schema definition'),
        })
      )
    })

    it('should detect multiple missing schemas', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { next: 'step2' as const } as any,
          step2: { next: 'step3' as const } as any,
          step3: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      const schemaErrors = errors.filter((e) => e.type === 'missing_schema')
      expect(schemaErrors).toHaveLength(2)
    })
  })

  describe('unreachable_step detection', () => {
    it('should detect unreachable step in branching flow', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step2' as const },
          step2: { schema: z.object({}) },
          step3: { schema: z.object({}) }, // Unreachable
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toContainEqual(
        expect.objectContaining({
          type: 'unreachable_step',
          step: 'step3',
          message: expect.stringContaining('unreachable from initial step'),
        })
      )
    })

    it('should detect multiple unreachable steps', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}) },
          step2: { schema: z.object({}) }, // Unreachable
          step3: { schema: z.object({}) }, // Unreachable
        },
      }

      const errors = validateFlowDefinition(definition)
      const unreachableErrors = errors.filter((e) => e.type === 'unreachable_step')
      expect(unreachableErrors).toHaveLength(2)
    })

    it('should not flag reachable steps', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: 'step2' as const },
          step2: { schema: z.object({}), next: 'step3' as const },
          step3: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      const unreachableErrors = errors.filter((e) => e.type === 'unreachable_step')
      expect(unreachableErrors).toHaveLength(0)
    })
  })

  describe('complex scenarios', () => {
    it('should detect multiple error types in single flow', () => {
      const definition = {
        initial: 'nonexistent' as any,
        steps: {
          step1: { next: 'step2' as const } as any, // Missing schema
          step2: { schema: z.object({}), next: 'invalid' as any }, // Invalid next
          step3: { schema: z.object({}) }, // Unreachable
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors.length).toBeGreaterThan(2)

      expect(errors.some((e) => e.type === 'missing_step')).toBe(true)
      expect(errors.some((e) => e.type === 'missing_schema')).toBe(true)
      expect(errors.some((e) => e.type === 'invalid_next')).toBe(true)
    })

    it('should handle flow with function-based next', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: {
            schema: z.object({}),
            next: ((_data: any) => 'step2') as any,
          },
          step2: { schema: z.object({}) },
        },
      }

      const errors = validateFlowDefinition(definition)
      // Should not error on dynamic next steps
      expect(errors.filter((e) => e.type === 'invalid_next')).toHaveLength(0)
    })

    it('should handle flow with null next (terminal step)', () => {
      const definition = {
        initial: 'step1' as const,
        steps: {
          step1: { schema: z.object({}), next: null },
        },
      }

      const errors = validateFlowDefinition(definition)
      expect(errors).toHaveLength(0)
    })
  })
})

describe('assertValidFlow', () => {
  it('should not throw for valid flow', () => {
    const definition: FormFlowDefinition<'step1' | 'step2', any> = {
      initial: 'step1',
      steps: {
        step1: { schema: z.object({}), next: 'step2' },
        step2: { schema: z.object({}) },
      },
    }

    expect(() => assertValidFlow(definition)).not.toThrow()
  })

  it('should throw for invalid flow', () => {
    const definition = {
      initial: 'nonexistent' as any,
      steps: {
        step1: { schema: z.object({}) },
      },
    }

    expect(() => assertValidFlow(definition)).toThrow('Flow definition validation failed')
  })

  it('should include error details in thrown message', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: { schema: z.object({}), next: 'invalid' as any },
      },
    }

    expect(() => assertValidFlow(definition)).toThrow('invalid_next')
  })

  it('should include error count in message', () => {
    const definition = {
      initial: 'nonexistent' as any,
      steps: {
        step1: { next: 'step2' as const } as any,
        step2: { schema: z.object({}) },
      },
    }

    expect(() => assertValidFlow(definition)).toThrow(/\d+ errors?/)
  })
})

describe('getFlowWarnings', () => {
  it('should warn about terminal steps', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: { schema: z.object({}), next: 'step2' as const },
        step2: { schema: z.object({}), next: null },
      },
    }

    const warnings = getFlowWarnings(definition)
    expect(warnings).toContainEqual(expect.stringContaining('has no next step defined'))
  })

  it('should warn about dynamic next functions', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: {
          schema: z.object({}),
          next: ((_data: any) => 'step2') as any,
        },
        step2: { schema: z.object({}) },
      },
    }

    const warnings = getFlowWarnings(definition)
    expect(warnings).toContainEqual(expect.stringContaining('uses a dynamic next function'))
  })

  it('should warn about single-step flows', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: { schema: z.object({}) },
      },
    }

    const warnings = getFlowWarnings(definition)
    expect(warnings).toContainEqual(expect.stringContaining('only one step'))
  })

  it('should return empty array for flow without warnings', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: { schema: z.object({}), next: 'step2' as const },
        step2: { schema: z.object({}), next: 'step3' as const },
        step3: { schema: z.object({}), next: 'step4' as const },
        step4: { schema: z.object({}) },
      },
    }

    const warnings = getFlowWarnings(definition)
    expect(warnings.length).toBeGreaterThan(0) // Will have terminal step warning
  })

  it('should handle multiple warnings', () => {
    const definition = {
      initial: 'step1' as const,
      steps: {
        step1: {
          schema: z.object({}),
          next: ((_data: any) => 'step2') as any,
        },
        step2: { schema: z.object({}), next: null },
      },
    }

    const warnings = getFlowWarnings(definition)
    expect(warnings.length).toBeGreaterThan(1)
  })
})
