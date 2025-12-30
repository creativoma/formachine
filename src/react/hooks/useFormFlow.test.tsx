import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from '../../core'
import { useFormFlow } from './useFormFlow'

describe('useFormFlow', () => {
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

  describe('initialization', () => {
    it('should initialize with first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.currentStep).toBe('step1')
      expect(result.current.path).toEqual(['step1'])
      expect(result.current.completedSteps.size).toBe(0)
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.isComplete).toBe(false)
    })

    it('should initialize with initial data', () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }

      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.getData('step1')).toEqual({ name: 'John' })
      expect(result.current.getData('step2')).toEqual({ email: 'john@example.com' })
      expect(result.current.path).toEqual(['step1', 'step2', 'step3'])
    })
  })

  describe('navigation', () => {
    it('should move to next step on valid data', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set valid data for step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })

      // Navigate to next step
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(true)
      })

      expect(result.current.currentStep).toBe('step2')
      expect(result.current.completedSteps.has('step1')).toBe(true)
      expect(result.current.path).toEqual(['step1', 'step2'])
    })

    it('should not move to next step on invalid data', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set invalid data (too short)
      act(() => {
        result.current.form.setValue('name', 'J')
      })

      // Attempt to navigate
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      expect(result.current.currentStep).toBe('step1')
      expect(result.current.completedSteps.has('step1')).toBe(false)
    })

    it('should go back to previous step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step2')

      // Go back
      act(() => {
        result.current.back()
      })

      expect(result.current.currentStep).toBe('step1')
      expect(result.current.canGoBack).toBe(false)
    })

    it('should not go back from first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.canGoBack).toBe(false)

      act(() => {
        result.current.back()
      })

      expect(result.current.currentStep).toBe('step1')
    })

    it('should navigate to specific step if allowed', async () => {
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

      expect(result.current.currentStep).toBe('step3')

      // Navigate back to step1
      act(() => {
        result.current.goTo('step1')
      })

      expect(result.current.currentStep).toBe('step1')
    })

    it('should not navigate to steps that are not reachable', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.canGoTo('step3')).toBe(false)

      act(() => {
        result.current.goTo('step3')
      })

      expect(result.current.currentStep).toBe('step1')
    })
  })

  describe('data management', () => {
    it('should store and retrieve step data', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(result.current.getData('step1')).toEqual({ name: 'John' })
      expect(result.current.path).toEqual(['step1', 'step2'])
    })

    it('should recalculate path when data changes', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Initially at start, no path calculated
      expect(result.current.path).toEqual(['start'])

      // Set data to go to branchA
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      expect(result.current.path).toEqual(['start', 'branchA'])

      // Change data to go to branchB
      act(() => {
        result.current.setData('start', { type: 'b' })
      })

      expect(result.current.path).toEqual(['start', 'branchB'])
    })
  })

  describe('callbacks', () => {
    it('should call onStepComplete when step is completed', async () => {
      const onStepComplete = vi.fn()
      const { result } = renderHook(() => useFormFlow(linearFlow, { onStepComplete }))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(onStepComplete).toHaveBeenCalledWith('step1', { name: 'John' })
    })

    it('should call onComplete when flow is finished', async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() => useFormFlow(linearFlow, { onComplete }))

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

      // Complete step3
      act(() => {
        result.current.form.setValue('done', true)
      })
      await act(async () => {
        await result.current.next()
      })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith({
          step1: { name: 'John' },
          step2: { email: 'john@example.com' },
          step3: { done: true },
        })
      })

      expect(result.current.isComplete).toBe(true)
    })

    it('should handle validation errors gracefully', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set invalid data (empty string, too short)
      act(() => {
        result.current.form.setValue('name', '')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should stay on same step
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
    })
  })

  describe('branching logic', () => {
    it('should follow correct branch based on data', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Choose branch A
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchA')
      expect(result.current.path).toEqual(['start', 'branchA'])
    })

    it('should update path when changing branch decision', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // First choose branch A
      act(() => {
        result.current.form.setValue('type', 'a')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchA')

      // Go back and choose branch B
      act(() => {
        result.current.back()
      })

      act(() => {
        result.current.form.setValue('type', 'b')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchB')
      expect(result.current.path).toEqual(['start', 'branchB'])
    })
  })

  describe('form integration', () => {
    it('should integrate with react-hook-form', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.form).toBeDefined()
      expect(result.current.form.register).toBeDefined()
      expect(result.current.form.formState).toBeDefined()
    })

    it('should reset form when moving to new step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      // Form should be reset for step2
      expect(result.current.form.getValues()).toEqual({})
    })

    it('should load existing data when navigating back', async () => {
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

      // Go back to step1
      act(() => {
        result.current.back()
      })
      act(() => {
        result.current.back()
      })

      // Data should be loaded
      await waitFor(() => {
        expect(result.current.form.getValues()).toEqual({ name: 'John' })
      })
    })
  })

  describe('reset', () => {
    it('should reset to initial state', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Make some progress by completing steps
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.size).toBeGreaterThan(0)
      expect(result.current.currentStep).toBe('step2')

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentStep).toBe('step1')
      expect(result.current.completedSteps.size).toBe(0)
      expect(result.current.state.data).toEqual({})
    })

    it('should reset with partial data', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Make some progress
      act(() => {
        result.current.setData('step1', { name: 'John' })
        result.current.setData('step2', { email: 'john@example.com' })
      })

      // Reset with new data
      act(() => {
        result.current.reset({ step1: { name: 'Jane' } })
      })

      expect(result.current.currentStep).toBe('step1')
      expect(result.current.getData('step1')).toEqual({ name: 'Jane' })
      expect(result.current.getData('step2')).toBeUndefined()
      // Path only includes steps with data
      expect(result.current.path).toEqual(['step1', 'step2'])
    })

    it('should reset form when resetting flow', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Set some form data
      act(() => {
        result.current.form.setValue('name', 'John')
      })

      expect(result.current.form.getValues()).toEqual({ name: 'John' })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.form.getValues()).toEqual({})
    })

    it('should recalculate path when resetting with data', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Set data for branch A
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      expect(result.current.path).toEqual(['start', 'branchA'])

      // Reset with branch B data
      act(() => {
        result.current.reset({ start: { type: 'b' } })
      })

      // Path only includes steps with data
      expect(result.current.path).toEqual(['start', 'branchB'])
    })

    it('should clear completed steps on full reset', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Complete step1
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('step1')).toBe(true)

      // Full reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.completedSteps.size).toBe(0)
    })

    it('should reset to initial step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Navigate to step2
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('step2')

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.currentStep).toBe('step1')
    })
  })
})
