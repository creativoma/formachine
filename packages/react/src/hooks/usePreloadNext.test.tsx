import { createFormFlow } from '@formachine/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from './useFormFlow'

/**
 * Tests for usePreloadNext hook functionality.
 * Since usePreloadNext uses values from FormFlowContext,
 * we test the preloading logic through useFormFlow and path calculations.
 */
describe('usePreloadNext', () => {
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

  const singleStepFlow = createFormFlow({
    id: 'single-step',
    steps: {
      only: {
        schema: z.object({
          value: z.string(),
        }),
        next: null,
      },
    },
    initial: 'only',
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

  // Helper to get next step from path
  const getNextStep = (path: string[], currentStep: string): string | null => {
    const currentIndex = path.indexOf(currentStep)
    if (currentIndex === -1 || currentIndex === path.length - 1) {
      return null
    }
    return path[currentIndex + 1] ?? null
  }

  describe('next step calculation', () => {
    it('should return next step when path has more steps', () => {
      const initialData = {
        step1: { name: 'John' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      const nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step2')
    })

    it('should return null when no next step exists (single step)', () => {
      const { result } = renderHook(() => useFormFlow(singleStepFlow))

      const nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBeNull()
    })

    it('should return null on last step', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // Navigate to last step
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step3')
      const nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBeNull()
    })
  })

  describe('preload eligibility based on status', () => {
    it('should be able to preload when status is idle', () => {
      const initialData = {
        step1: { name: 'John' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.state.status).toBe('idle')
      // When status is 'idle', preloading should be allowed
      const canPreload = result.current.state.status === 'idle'
      expect(canPreload).toBe(true)
    })

    it('should not preload during validation/error states', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set invalid data
      act(() => {
        result.current.form.setValue('name', 'J') // too short
      })

      // Try to navigate (will fail validation)
      await act(async () => {
        await result.current.next()
      })

      // Status should be error
      expect(result.current.state.status).toBe('error')
    })
  })

  describe('dynamic path updates for preloading', () => {
    it('should update next step when path changes', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Initially no next step (need data to determine branch)
      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBeNull()

      // Set data to reveal branchA
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('branchA')
    })

    it('should update when branch changes', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Choose branch A
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('branchA')

      // Change to branch B
      act(() => {
        result.current.setData('start', { type: 'b' })
      })

      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('branchB')
    })
  })

  describe('navigation updates for preloading', () => {
    it('should update next step after navigation', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.currentStep).toBe('step1')
      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step2')

      // Navigate to step2
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step2')
      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step3')
    })

    it('should handle going back', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // Navigate forward
      await act(async () => {
        await result.current.next()
      })

      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step3')

      // Navigate back
      act(() => {
        result.current.back()
      })

      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step2')
    })
  })

  describe('end of flow handling', () => {
    it('should handle flow at end', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
        step3: { done: true },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // Navigate to end
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.next()
      })

      const nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBeNull()
    })

    it('should handle single step flow', () => {
      const { result } = renderHook(() => useFormFlow(singleStepFlow))

      const nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBeNull()
    })
  })

  describe('preload logic scenarios', () => {
    it('should identify preloadable steps in middle of flow', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // At step1, can preload step2
      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step2')

      // Navigate to step2, can preload step3
      await act(async () => {
        await result.current.next()
      })
      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('step3')
    })

    it('should work with branching flows', async () => {
      const { result } = renderHook(() =>
        useFormFlow(branchingFlow, {
          initialData: {
            start: { type: 'a' },
            branchA: { valueA: 'test' },
          },
        })
      )

      // At start, next is branchA
      let nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('branchA')

      // Navigate to branchA
      await act(async () => {
        await result.current.next()
      })

      // At branchA, next is end
      nextStep = getNextStep(result.current.path, result.current.currentStep)
      expect(nextStep).toBe('end')
    })
  })
})
