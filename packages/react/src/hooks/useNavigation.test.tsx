import { createFormFlow } from '@formachine/core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from './useFormFlow'

/**
 * Tests for useNavigation hook functionality.
 * Since useNavigation extracts navigation-related values from the FormFlowContext,
 * we test through useFormFlow which provides these values.
 */
describe('useNavigation', () => {
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

  describe('currentStep', () => {
    it('should return current step from context', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.currentStep).toBe('step1')
    })

    it('should update current step after navigation', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step2')
    })
  })

  describe('completedSteps', () => {
    it('should return empty completed steps initially', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.completedSteps.size).toBe(0)
    })

    it('should track completed steps correctly', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('step1')).toBe(true)
      expect(result.current.completedSteps.size).toBe(1)

      // Complete step2
      act(() => {
        result.current.form.setValue('email', 'john@example.com')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('step2')).toBe(true)
      expect(result.current.completedSteps.size).toBe(2)
    })
  })

  describe('isSubmitting', () => {
    it('should not be submitting initially', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('canGoBack', () => {
    it('should return false on first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.canGoBack).toBe(false)
    })

    it('should return true after navigating forward', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.canGoBack).toBe(true)
    })
  })

  describe('canGoNext', () => {
    it('should return true when there is a next step in path', () => {
      const { result } = renderHook(() =>
        useFormFlow(linearFlow, {
          initialData: { step1: { name: 'John' } },
        })
      )

      expect(result.current.canGoNext).toBe(true)
    })

    it('should return true on last step if not completed (allows submit)', async () => {
      const { result } = renderHook(() =>
        useFormFlow(linearFlow, {
          initialData: {
            step1: { name: 'John' },
            step2: { email: 'john@example.com' },
          },
        })
      )

      // Navigate to last step
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step3')
      // canGoNext is true because the step is not yet completed (allows submit action)
      expect(result.current.canGoNext).toBe(true)
    })

    it('should return false after completing the last step', async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() =>
        useFormFlow(linearFlow, {
          initialData: {
            step1: { name: 'John' },
            step2: { email: 'john@example.com' },
          },
          onComplete,
        })
      )

      // Navigate through all steps
      await act(async () => {
        await result.current.next()
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step3')

      // Complete the last step
      act(() => {
        result.current.form.setValue('done', true)
      })
      await act(async () => {
        await result.current.next()
      })

      // After completion, canGoNext should be false
      expect(result.current.canGoNext).toBe(false)
      expect(result.current.isComplete).toBe(true)
    })
  })

  describe('canGoTo', () => {
    it('should return false for unreachable steps', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.canGoTo('step3')).toBe(false)
    })

    it('should return true for the current step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.canGoTo('step1')).toBe(true)
    })

    it('should return true for completed steps', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.canGoTo('step1')).toBe(true)
    })
  })

  describe('goTo', () => {
    it('should navigate to a valid step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1 and step2
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      act(() => {
        result.current.form.setValue('email', 'john@example.com')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step3')

      // Navigate back to step1
      act(() => {
        result.current.goTo('step1')
      })

      expect(result.current.currentStep).toBe('step1')
    })

    it('should not navigate to unreachable step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.goTo('step3')
      })

      expect(result.current.currentStep).toBe('step1')
    })
  })

  describe('next', () => {
    it('should return true on successful navigation', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.next()
      })

      expect(success).toBe(true)
      expect(result.current.currentStep).toBe('step2')
    })

    it('should return false on validation error', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set invalid data (too short)
      act(() => {
        result.current.form.setValue('name', 'J')
      })

      let success: boolean | undefined
      await act(async () => {
        success = await result.current.next()
      })

      expect(success).toBe(false)
      expect(result.current.currentStep).toBe('step1')
    })

    it('should add step to completed steps on success', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('step1')).toBe(true)
    })
  })

  describe('back', () => {
    it('should navigate to previous step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Navigate forward
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step2')

      // Navigate back
      act(() => {
        result.current.back()
      })

      expect(result.current.currentStep).toBe('step1')
    })

    it('should not navigate back from first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.back()
      })

      expect(result.current.currentStep).toBe('step1')
    })
  })

  describe('with branching flow', () => {
    it('should correctly navigate through branches', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Choose branch A
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchA')
    })

    it('should handle branch changes correctly', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Choose branch A first
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchA')

      // Go back
      act(() => {
        result.current.back()
      })

      // Now choose branch B
      act(() => {
        result.current.form.setValue('type', 'b')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchB')
    })
  })

  describe('edge cases', () => {
    it('should handle rapid next/back calls', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      // Navigate forward
      await act(async () => {
        await result.current.next()
      })

      // Quickly back
      act(() => {
        result.current.back()
      })

      expect(result.current.currentStep).toBe('step1')
    })

    it('should handle multiple goTo calls', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete all steps
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      act(() => {
        result.current.form.setValue('email', 'john@example.com')
      })
      await act(async () => {
        await result.current.next()
      })

      // Multiple goTo calls
      act(() => {
        result.current.goTo('step1')
      })
      expect(result.current.currentStep).toBe('step1')

      act(() => {
        result.current.goTo('step2')
      })
      expect(result.current.currentStep).toBe('step2')

      act(() => {
        result.current.goTo('step3')
      })
      expect(result.current.currentStep).toBe('step3')
    })
  })
})
