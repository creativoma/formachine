import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { FlowDefinition } from '../types/flow'
import { canNavigateToStep, getNextStep, getPreviousStep, resolveTransition } from './transitions'

describe('transitions', () => {
  const linearFlow = {
    id: 'linear',
    steps: {
      step1: {
        schema: z.object({ name: z.string() }),
        next: 'step2',
      },
      step2: {
        schema: z.object({ email: z.string() }),
        next: 'step3',
      },
      step3: {
        schema: z.object({ done: z.boolean() }),
        next: null,
      },
    },
    initial: 'step1',
  } as const

  const branchingFlow = {
    id: 'branching',
    steps: {
      start: {
        schema: z.object({ type: z.enum(['a', 'b']) }),
        next: (data: { type: 'a' | 'b' }) => (data.type === 'a' ? 'branchA' : 'branchB'),
      },
      branchA: {
        schema: z.object({ valueA: z.string() }),
        next: 'end',
      },
      branchB: {
        schema: z.object({ valueB: z.string() }),
        next: 'end',
      },
      end: {
        schema: z.object({ confirmed: z.boolean() }),
        next: null,
      },
    },
    initial: 'start',
  } as const satisfies FlowDefinition<any>

  describe('resolveTransition', () => {
    it('should resolve static transition', () => {
      const result = resolveTransition(
        linearFlow,
        'step1',
        { name: 'John' },
        { step1: { name: 'John' } }
      )
      expect(result).toBe('step2')
    })

    it('should resolve null transition', () => {
      const result = resolveTransition(
        linearFlow,
        'step3',
        { done: true },
        { step3: { done: true } }
      )
      expect(result).toBeNull()
    })

    it('should resolve function transition to branchA', () => {
      const result = resolveTransition(
        branchingFlow,
        'start',
        { type: 'a' },
        { start: { type: 'a' } }
      )
      expect(result).toBe('branchA')
    })

    it('should resolve function transition to branchB', () => {
      const result = resolveTransition(
        branchingFlow,
        'start',
        { type: 'b' },
        { start: { type: 'b' } }
      )
      expect(result).toBe('branchB')
    })

    it('should handle function returning null', () => {
      const flowWithNullFn = {
        id: 'null-fn',
        steps: {
          start: {
            schema: z.object({ skip: z.boolean() }),
            next: (data: { skip: boolean }) => (data.skip ? null : 'end'),
          },
          end: {
            schema: z.object({ done: z.boolean() }),
            next: null,
          },
        },
        initial: 'start',
      } as const satisfies FlowDefinition<any>

      const result = resolveTransition(
        flowWithNullFn,
        'start',
        { skip: true },
        { start: { skip: true } }
      )
      expect(result).toBeNull()
    })

    it('should return null for non-existent step', () => {
      type StepIds = 'step1' | 'step2' | 'step3'
      const result = resolveTransition(linearFlow, 'nonexistent' as StepIds, {}, {})
      expect(result).toBeNull()
    })
  })

  describe('canNavigateToStep', () => {
    type LinearStepIds = 'step1' | 'step2' | 'step3'

    it('should allow navigation to completed steps in path', () => {
      const completedSteps = new Set<LinearStepIds>(['step1', 'step2'])
      const path: LinearStepIds[] = ['step1', 'step2', 'step3']

      expect(canNavigateToStep(linearFlow, 'step1', completedSteps, path)).toBe(true)
      expect(canNavigateToStep(linearFlow, 'step2', completedSteps, path)).toBe(true)
    })

    it('should allow navigation to next uncompleted step in path', () => {
      const completedSteps = new Set<LinearStepIds>(['step1'])
      const path: LinearStepIds[] = ['step1', 'step2', 'step3']

      expect(canNavigateToStep(linearFlow, 'step2', completedSteps, path)).toBe(true)
    })

    it('should not allow navigation to steps not in path', () => {
      type BranchingStepIds = 'start' | 'branchA' | 'branchB' | 'end'
      const completedSteps = new Set<BranchingStepIds>(['start'])
      const path: BranchingStepIds[] = ['start', 'branchA', 'end']

      expect(canNavigateToStep(branchingFlow, 'branchB', completedSteps, path)).toBe(false)
    })

    it('should not allow skipping uncompleted steps', () => {
      const completedSteps = new Set<LinearStepIds>(['step1'])
      const path: LinearStepIds[] = ['step1', 'step2', 'step3']

      expect(canNavigateToStep(linearFlow, 'step3', completedSteps, path)).toBe(false)
    })

    it('should allow navigation to first step even if not completed', () => {
      const completedSteps = new Set<LinearStepIds>()
      const path: LinearStepIds[] = ['step1', 'step2', 'step3']

      expect(canNavigateToStep(linearFlow, 'step1', completedSteps, path)).toBe(true)
    })

    it('should handle empty path', () => {
      const completedSteps = new Set<LinearStepIds>()
      const path: LinearStepIds[] = []

      expect(canNavigateToStep(linearFlow, 'step1', completedSteps, path)).toBe(false)
    })
  })

  describe('getNextStep', () => {
    it('should return next step in path', () => {
      const path = ['step1', 'step2', 'step3']
      expect(getNextStep('step1', path)).toBe('step2')
      expect(getNextStep('step2', path)).toBe('step3')
    })

    it('should return null at end of path', () => {
      const path = ['step1', 'step2', 'step3']
      expect(getNextStep('step3', path)).toBeNull()
    })

    it('should return null for step not in path', () => {
      const path = ['step1', 'step2']
      expect(getNextStep('step3', path)).toBeNull()
    })

    it('should handle single step path', () => {
      const path = ['step1']
      expect(getNextStep('step1', path)).toBeNull()
    })

    it('should handle empty path', () => {
      const path: string[] = []
      expect(getNextStep('step1', path)).toBeNull()
    })
  })

  describe('getPreviousStep', () => {
    it('should return previous step in path', () => {
      const path = ['step1', 'step2', 'step3']
      expect(getPreviousStep('step2', path)).toBe('step1')
      expect(getPreviousStep('step3', path)).toBe('step2')
    })

    it('should return null at start of path', () => {
      const path = ['step1', 'step2', 'step3']
      expect(getPreviousStep('step1', path)).toBeNull()
    })

    it('should return null for step not in path', () => {
      const path = ['step1', 'step2']
      expect(getPreviousStep('step3', path)).toBeNull()
    })

    it('should handle single step path', () => {
      const path = ['step1']
      expect(getPreviousStep('step1', path)).toBeNull()
    })

    it('should handle empty path', () => {
      const path: string[] = []
      expect(getPreviousStep('step1', path)).toBeNull()
    })
  })
})
