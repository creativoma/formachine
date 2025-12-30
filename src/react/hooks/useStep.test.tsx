import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from '../../core'
import { FormFlowProvider } from '../components/Provider'
import { useFormFlow } from './useFormFlow'
import { useStep } from './useStep'

/**
 * Tests for useStep hook functionality.
 * We test both directly using useStep and through useFormFlow.
 */
describe('useStep', () => {
  const linearFlow = createFormFlow({
    id: 'linear-flow',
    steps: {
      step1: {
        schema: z.object({
          name: z.string().min(2),
        }),
        next: 'step2',
      },
      step2: {
        schema: z.object({
          email: z.string().email(),
        }),
        next: 'step3',
      },
      step3: {
        schema: z.object({
          done: z.boolean(),
        }),
        next: null,
      },
    },
    initial: 'step1',
  })

  const branchingFlow = createFormFlow({
    id: 'branching-flow',
    steps: {
      start: {
        schema: z.object({
          type: z.enum(['a', 'b']),
        }),
        next: (data: { type: 'a' | 'b' }) => (data.type === 'a' ? 'branchA' : 'branchB'),
      },
      branchA: {
        schema: z.object({
          valueA: z.string(),
        }),
        next: 'end',
      },
      branchB: {
        schema: z.object({
          valueB: z.string(),
        }),
        next: 'end',
      },
      end: {
        schema: z.object({
          confirmed: z.boolean(),
        }),
        next: null,
      },
    },
    initial: 'start',
  })

  // Helper functions that mirror useStep's calculations
  const isStepActive = (currentStep: string, stepId: string) => currentStep === stepId
  const isStepCompleted = (completedSteps: Set<string>, stepId: string) =>
    completedSteps.has(stepId)
  const isStepReachable = (path: string[], stepId: string) => path.includes(stepId)

  describe('direct hook usage', () => {
    it('should return step values from context', () => {
      const { result: formFlowResult } = renderHook(() => useFormFlow(linearFlow))

      const { result } = renderHook(() => useStep('step1'), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FormFlowProvider value={formFlowResult.current}>{children}</FormFlowProvider>
        ),
      })

      expect(result.current.stepId).toBe('step1')
      expect(result.current.isActive).toBe(true)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.isReachable).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should return correct values for inactive step', () => {
      const { result: formFlowResult } = renderHook(() => useFormFlow(linearFlow))

      const { result } = renderHook(() => useStep('step2'), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FormFlowProvider value={formFlowResult.current}>{children}</FormFlowProvider>
        ),
      })

      expect(result.current.stepId).toBe('step2')
      expect(result.current.isActive).toBe(false)
      expect(result.current.isCompleted).toBe(false)
      expect(result.current.isReachable).toBe(false)
    })
  })

  describe('isActive', () => {
    it('should return true when step is current', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepActive(result.current.currentStep, 'step1')).toBe(true)
    })

    it('should return false when step is not current', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepActive(result.current.currentStep, 'step2')).toBe(false)
    })

    it('should update when navigating', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepActive(result.current.currentStep, 'step1')).toBe(true)

      // Navigate to step2
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepActive(result.current.currentStep, 'step1')).toBe(false)
      expect(isStepActive(result.current.currentStep, 'step2')).toBe(true)
    })

    it('should become active when navigated to', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepActive(result.current.currentStep, 'step2')).toBe(false)

      // Navigate to step2
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepActive(result.current.currentStep, 'step2')).toBe(true)
    })
  })

  describe('isCompleted', () => {
    it('should return false for uncompleted step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(false)
    })

    it('should return true after step is completed', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(true)
    })

    it('should remain completed after navigating away and back', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      // Complete step2
      act(() => {
        result.current.form.setValue('email', 'john@example.com')
      })
      await act(async () => {
        await result.current.next()
      })

      // Navigate back to step1
      act(() => {
        result.current.goTo('step1')
      })

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(true)
    })

    it('should track multiple completed steps', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      // Complete step2
      act(() => {
        result.current.form.setValue('email', 'john@example.com')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(true)
      expect(isStepCompleted(result.current.completedSteps, 'step2')).toBe(true)
      expect(isStepCompleted(result.current.completedSteps, 'step3')).toBe(false)
    })
  })

  describe('isReachable', () => {
    it('should return true for initial step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepReachable(result.current.path, 'step1')).toBe(true)
    })

    it('should return false for step not in path', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // step3 is not in path yet
      expect(isStepReachable(result.current.path, 'step3')).toBe(false)
    })

    it('should become reachable as path expands', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(isStepReachable(result.current.path, 'step2')).toBe(false)

      // Set data to expand path
      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(isStepReachable(result.current.path, 'step2')).toBe(true)
    })

    it('should handle branching paths', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      expect(isStepReachable(result.current.path, 'branchA')).toBe(false)

      // Set data to choose branchA
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      expect(isStepReachable(result.current.path, 'branchA')).toBe(true)
      expect(isStepReachable(result.current.path, 'branchB')).toBe(false)
    })

    it('should become unreachable when branch changes', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // First choose branchA
      act(() => {
        result.current.setData('start', { type: 'a' })
      })
      expect(isStepReachable(result.current.path, 'branchA')).toBe(true)

      // Change to branchB
      act(() => {
        result.current.setData('start', { type: 'b' })
      })
      expect(isStepReachable(result.current.path, 'branchA')).toBe(false)
      expect(isStepReachable(result.current.path, 'branchB')).toBe(true)
    })
  })

  describe('data (getData)', () => {
    it('should return undefined for step without data', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.getData('step1')).toBeUndefined()
    })

    it('should return data after setData', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(result.current.getData('step1')).toEqual({ name: 'John' })
    })

    it('should return initial data if provided', () => {
      const initialData = {
        step1: { name: 'Initial Name' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.getData('step1')).toEqual({ name: 'Initial Name' })
    })

    it('should return correct data for each step', () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.getData('step1')).toEqual({ name: 'John' })
      expect(result.current.getData('step2')).toEqual({ email: 'john@example.com' })
    })

    it('should update when data changes', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(result.current.getData('step1')).toEqual({ name: 'John' })

      act(() => {
        result.current.setData('step1', { name: 'Jane' })
      })

      expect(result.current.getData('step1')).toEqual({ name: 'Jane' })
    })
  })

  describe('combined step state', () => {
    it('should correctly combine isActive, isCompleted, isReachable', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Initially step1: active, not completed, reachable
      expect(isStepActive(result.current.currentStep, 'step1')).toBe(true)
      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(false)
      expect(isStepReachable(result.current.path, 'step1')).toBe(true)

      // step2 initially: not active, not completed, not reachable
      expect(isStepActive(result.current.currentStep, 'step2')).toBe(false)
      expect(isStepCompleted(result.current.completedSteps, 'step2')).toBe(false)
      expect(isStepReachable(result.current.path, 'step2')).toBe(false)

      // Complete step1 and navigate
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      // step1: not active, completed, reachable
      expect(isStepActive(result.current.currentStep, 'step1')).toBe(false)
      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(true)
      expect(isStepReachable(result.current.path, 'step1')).toBe(true)

      // step2: active, not completed, reachable
      expect(isStepActive(result.current.currentStep, 'step2')).toBe(true)
      expect(isStepCompleted(result.current.completedSteps, 'step2')).toBe(false)
      expect(isStepReachable(result.current.path, 'step2')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle step that does not exist in flow', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Non-existent step should be false for everything
      expect(isStepActive(result.current.currentStep, 'nonexistent')).toBe(false)
      expect(isStepCompleted(result.current.completedSteps, 'nonexistent')).toBe(false)
      expect(isStepReachable(result.current.path, 'nonexistent')).toBe(false)
      expect(result.current.getData('nonexistent')).toBeUndefined()
    })

    it('should handle step at end of flow', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // Navigate to step3
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepActive(result.current.currentStep, 'step3')).toBe(true)
      expect(isStepReachable(result.current.path, 'step3')).toBe(true)
    })

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Rapid data changes
      act(() => {
        result.current.setData('step1', { name: 'A' })
      })
      act(() => {
        result.current.setData('step1', { name: 'AB' })
      })
      act(() => {
        result.current.setData('step1', { name: 'ABC' })
      })

      expect(result.current.getData('step1')).toEqual({ name: 'ABC' })
    })

    it('should handle reset clearing step states', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete a step
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(true)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(isStepCompleted(result.current.completedSteps, 'step1')).toBe(false)
      expect(isStepActive(result.current.currentStep, 'step1')).toBe(true)
    })
  })
})
