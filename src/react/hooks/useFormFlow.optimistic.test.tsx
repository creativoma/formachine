import { createFormFlow } from '../../core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from './useFormFlow'

/**
 * Tests for optimistic navigation in useFormFlow
 */
describe('useFormFlow - optimistic navigation', () => {
  const testFlow = createFormFlow({
    id: 'optimistic-flow',
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
          age: z.number().min(18),
        }),
        next: null,
      },
    },
    initial: 'step1',
  })

  describe('optimistic navigation success', () => {
    it('should navigate optimistically and validate in background', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: true,
        })
      )

      expect(result.current.currentStep).toBe('step1')

      // Set valid data
      act(() => {
        result.current.form.setValue('name', 'John Doe')
      })

      // Should navigate immediately and validate in background
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(true)
      })

      expect(result.current.currentStep).toBe('step2')
      expect(result.current.completedSteps.has('step1')).toBe(true)
    })
  })

  describe('optimistic navigation with validation error', () => {
    it('should revert to previous step on validation error', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: true,
        })
      )

      expect(result.current.currentStep).toBe('step1')

      // Set invalid data (too short)
      act(() => {
        result.current.form.setValue('name', 'J')
      })

      // Should navigate optimistically, then revert on validation error
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should be back on step1 after validation failed
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
      expect(result.current.completedSteps.has('step1')).toBe(false)
    })

    it('should restore form data after reverting', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          initialData: {
            step1: { name: 'Initial Name' },
          },
          optimisticNavigation: true,
        })
      )

      // Form should have initial data
      expect(result.current.form.getValues()).toEqual({ name: 'Initial Name' })

      // Set invalid data
      act(() => {
        result.current.form.setValue('name', 'X')
      })

      // Try to navigate - should fail and revert
      await act(async () => {
        await result.current.next()
      })

      // Form should be restored to initial data
      expect(result.current.form.getValues()).toEqual({ name: 'Initial Name' })
    })
  })

  describe('optimistic navigation with errors', () => {
    it('should handle validation errors and revert', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: true,
          onError,
        })
      )

      // Set invalid data
      act(() => {
        result.current.form.setValue('name', '')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should revert to step1
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
    })

    it('should handle async validation errors with optimistic navigation', async () => {
      const flowWithAsyncValidation = createFormFlow({
        id: 'async-flow',
        steps: {
          step1: {
            schema: z
              .object({
                username: z.string(),
              })
              .refine(
                async (data) => {
                  // Simulate async validation that fails
                  await new Promise((resolve) => setTimeout(resolve, 10))
                  return data.username !== 'taken'
                },
                { message: 'Username is taken' }
              ),
            next: 'step2',
          },
          step2: {
            schema: z.object({ email: z.string().email() }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() =>
        useFormFlow(flowWithAsyncValidation, {
          optimisticNavigation: true,
        })
      )

      act(() => {
        result.current.form.setValue('username', 'taken')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should be reverted to step1
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
    })
  })

  describe('optimistic navigation at end of flow', () => {
    it('should not navigate optimistically when at last step', async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          initialData: {
            step1: { name: 'John' },
            step2: { email: 'john@example.com' },
          },
          optimisticNavigation: true,
          onComplete,
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

      // Complete the flow
      act(() => {
        result.current.form.setValue('age', 25)
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(true)
      })

      expect(result.current.isComplete).toBe(true)
      expect(onComplete).toHaveBeenCalledWith({
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
        step3: { age: 25 },
      })
    })
  })

  describe('standard navigation (non-optimistic)', () => {
    it('should validate before navigating when optimistic is false', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: false,
        })
      )

      expect(result.current.currentStep).toBe('step1')

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      // Should validate first, then navigate
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(true)
      })

      expect(result.current.currentStep).toBe('step2')
      expect(result.current.state.status).toBe('idle')
    })

    it('should not navigate on validation error when optimistic is false', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: false,
        })
      )

      act(() => {
        result.current.form.setValue('name', 'X')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should stay on step1
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
    })
  })
})
