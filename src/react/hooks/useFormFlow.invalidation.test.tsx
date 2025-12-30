import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from '../../core'
import { useFormFlow } from './useFormFlow'

describe('useFormFlow - Step Invalidation', () => {
  const branchingFlow = createFormFlow({
    id: 'branching-flow',
    steps: {
      start: {
        schema: z.object({
          type: z.enum(['a', 'b'] as const),
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

  describe('when path changes via setData', () => {
    it('should invalidate steps no longer in path', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Complete start step via next()
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      // Complete branchA via next()
      act(() => {
        result.current.form.setValue('valueA', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('start')).toBe(true)
      expect(result.current.completedSteps.has('branchA')).toBe(true)
      expect(result.current.path).toEqual(['start', 'branchA', 'end'])

      // Change decision on start step (switch to branch B)
      act(() => {
        result.current.setData('start', { type: 'b' })
      })

      // branchA should be invalidated (no longer in path)
      expect(result.current.completedSteps.has('start')).toBe(true)
      expect(result.current.completedSteps.has('branchA')).toBe(false)
      expect(result.current.completedSteps.has('branchB')).toBe(false)
      expect(result.current.path).toEqual(['start', 'branchB'])
    })

    it('should keep completed steps that remain in new path', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Complete start via next()
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      // Complete branchA via next()
      act(() => {
        result.current.form.setValue('valueA', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.completedSteps.has('start')).toBe(true)
      expect(result.current.completedSteps.has('branchA')).toBe(true)

      // Set data on branchA again (path doesn't change)
      act(() => {
        result.current.setData('branchA', { valueA: 'updated' })
      })

      // Both should still be completed
      expect(result.current.completedSteps.has('start')).toBe(true)
      expect(result.current.completedSteps.has('branchA')).toBe(true)
    })
  })

  describe('when path changes during navigation', () => {
    it('should invalidate steps when completing a step that changes the path', async () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Navigate through branch A
      act(() => {
        result.current.form.setValue('type', 'a')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('branchA')
      expect(result.current.completedSteps.has('start')).toBe(true)

      // Complete branchA
      act(() => {
        result.current.form.setValue('valueA', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStep).toBe('end')
      expect(result.current.completedSteps.has('branchA')).toBe(true)

      // Go back to start and change branch
      act(() => {
        result.current.goTo('start')
      })

      act(() => {
        result.current.form.setValue('type', 'b')
      })

      await act(async () => {
        await result.current.next()
      })

      // branchA should be invalidated, we should be on branchB
      expect(result.current.currentStep).toBe('branchB')
      expect(result.current.completedSteps.has('start')).toBe(true)
      expect(result.current.completedSteps.has('branchA')).toBe(false)
      expect(result.current.path).toEqual(['start', 'branchB'])
    })
  })

  describe('complex branching scenarios', () => {
    const complexFlow = createFormFlow({
      id: 'complex-branching',
      steps: {
        q1: {
          schema: z.object({ answer: z.enum(['yes', 'no']) }),
          next: (data: { answer: 'yes' | 'no' }) => (data.answer === 'yes' ? 'q2a' : 'q2b'),
        },
        q2a: {
          schema: z.object({ detail: z.string() }),
          next: (data: { detail: string }) => (data.detail.length > 10 ? 'q3a' : 'q3b'),
        },
        q2b: {
          schema: z.object({ reason: z.string() }),
          next: 'final',
        },
        q3a: {
          schema: z.object({ extra: z.string() }),
          next: 'final',
        },
        q3b: {
          schema: z.object({ short: z.string() }),
          next: 'final',
        },
        final: {
          schema: z.object({ done: z.boolean() }),
          next: null,
        },
      },
      initial: 'q1',
    })

    it('should handle nested branching with multiple invalidations', async () => {
      const { result } = renderHook(() => useFormFlow(complexFlow))

      // Complete q1 -> q2a -> q3a through navigation
      act(() => {
        result.current.form.setValue('answer', 'yes')
      })
      await act(async () => {
        await result.current.next() // q1 complete -> q2a
      })

      act(() => {
        result.current.form.setValue('detail', 'This is a very long detail')
      })
      await act(async () => {
        await result.current.next() // q2a complete -> q3a
      })

      act(() => {
        result.current.form.setValue('extra', 'extra info')
      })
      await act(async () => {
        await result.current.next() // q3a complete -> final
      })

      expect(result.current.completedSteps.has('q1')).toBe(true)
      expect(result.current.completedSteps.has('q2a')).toBe(true)
      expect(result.current.completedSteps.has('q3a')).toBe(true)

      // Go back and change q2a to short answer
      act(() => {
        result.current.setData('q2a', { detail: 'short' })
      })

      // q3a should be invalidated, path should change to q3b
      expect(result.current.path).toEqual(['q1', 'q2a', 'q3b'])
      expect(result.current.completedSteps.has('q1')).toBe(true)
      expect(result.current.completedSteps.has('q2a')).toBe(true)
      expect(result.current.completedSteps.has('q3a')).toBe(false)

      // Change q1 to no
      act(() => {
        result.current.setData('q1', { answer: 'no' })
      })

      // q2a and q3a should both be invalidated
      expect(result.current.path).toEqual(['q1', 'q2b'])
      expect(result.current.completedSteps.has('q1')).toBe(true)
      expect(result.current.completedSteps.has('q2a')).toBe(false)
      expect(result.current.completedSteps.has('q3a')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty completed steps', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      // No steps completed yet, should not throw
      expect(result.current.completedSteps.size).toBe(0)
      expect(result.current.path).toEqual(['start', 'branchA'])
    })

    it('should handle path that stays the same', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      act(() => {
        result.current.setData('start', { type: 'a' })
        result.current.setData('branchA', { valueA: 'test' })
      })

      const completedBefore = new Set(result.current.completedSteps)

      // Update start with same value (path stays the same)
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      // Completed steps should remain the same
      expect(result.current.completedSteps).toEqual(completedBefore)
    })
  })
})
