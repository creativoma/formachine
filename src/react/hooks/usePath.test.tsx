import { createFormFlow } from '../../core'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from './useFormFlow'
import { usePath } from './usePath'
import { FormFlowProvider } from '../components/Provider'
import type { ReactNode } from 'react'

/**
 * Tests for usePath hook functionality.
 * We test both directly using usePath and through useFormFlow.
 */
describe('usePath', () => {
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

  describe('direct hook usage', () => {
    it('should return path values from context', () => {
      const { result: formFlowResult } = renderHook(() => useFormFlow(linearFlow))

      const { result } = renderHook(() => usePath(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FormFlowProvider value={formFlowResult.current}>
            {children}
          </FormFlowProvider>
        ),
      })

      expect(result.current.reachablePath).toEqual(['step1'])
      expect(result.current.totalSteps).toBe(1)
      expect(result.current.currentIndex).toBe(0)
      expect(result.current.progress).toBeCloseTo(100, 1)
      expect(result.current.isFirstStep).toBe(true)
      expect(result.current.isLastStep).toBe(true)
    })
  })

  describe('path (reachablePath)', () => {
    it('should return initial path with first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      expect(result.current.path).toEqual(['step1'])
    })

    it('should expand path as data is set', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(result.current.path).toEqual(['step1', 'step2'])
    })

    it('should calculate full path with initial data', () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }

      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      expect(result.current.path).toEqual(['step1', 'step2', 'step3'])
    })

    it('should handle branching paths', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

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

  describe('path length (totalSteps equivalent)', () => {
    it('should return correct total for current path', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Initially only step1 is in path
      expect(result.current.path.length).toBe(1)

      // After setting data, path expands
      act(() => {
        result.current.setData('step1', { name: 'John' })
      })

      expect(result.current.path.length).toBe(2)
    })

    it('should return 1 for single step flow', () => {
      const { result } = renderHook(() => useFormFlow(singleStepFlow))

      expect(result.current.path.length).toBe(1)
    })
  })

  describe('currentIndex (path.indexOf(currentStep))', () => {
    it('should return 0 for first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex).toBe(0)
    })

    it('should update when navigating', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex).toBe(1)
    })

    it('should return correct index after multiple navigations', async () => {
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

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex).toBe(2)
    })
  })

  describe('progress calculation', () => {
    it('should calculate progress based on path position', () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      const progress = path.length > 0 ? ((currentIndex + 1) / path.length) * 100 : 0

      // At step1 with full path: (0 + 1) / 3 * 100 = 33.33%
      expect(progress).toBeCloseTo(33.33, 1)
    })

    it('should show 100% progress on last step', async () => {
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

      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      const progress = path.length > 0 ? ((currentIndex + 1) / path.length) * 100 : 0

      expect(progress).toBe(100)
    })
  })

  describe('isFirstStep (currentIndex === 0)', () => {
    it('should return true on first step', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex === 0).toBe(true)
    })

    it('should return false after navigating', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      act(() => {
        result.current.form.setValue('name', 'John')
      })

      await act(async () => {
        await result.current.next()
      })

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex === 0).toBe(false)
    })

    it('should return true after navigating back to first step', async () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Navigate forward
      act(() => {
        result.current.form.setValue('name', 'John')
      })
      await act(async () => {
        await result.current.next()
      })

      // Navigate back
      act(() => {
        result.current.back()
      })

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex === 0).toBe(true)
    })

    it('should be true for single step flow', () => {
      const { result } = renderHook(() => useFormFlow(singleStepFlow))

      const currentIndex = result.current.path.indexOf(result.current.currentStep)
      expect(currentIndex === 0).toBe(true)
    })
  })

  describe('isLastStep (currentIndex === path.length - 1)', () => {
    it('should return true when on last step of current path', () => {
      const { result } = renderHook(() => useFormFlow(linearFlow))

      // Initially step1 is the only step in path, so it's the last
      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      expect(currentIndex === path.length - 1).toBe(true)
    })

    it('should return false when not on last step', () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      expect(currentIndex === path.length - 1).toBe(false)
    })

    it('should return true when navigated to last step', async () => {
      const initialData = {
        step1: { name: 'John' },
        step2: { email: 'john@example.com' },
      }
      const { result } = renderHook(() => useFormFlow(linearFlow, { initialData }))

      // Navigate to step2
      await act(async () => {
        await result.current.next()
      })

      // Navigate to step3
      await act(async () => {
        await result.current.next()
      })

      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      expect(currentIndex === path.length - 1).toBe(true)
    })

    it('should be true for single step flow', () => {
      const { result } = renderHook(() => useFormFlow(singleStepFlow))

      const path = result.current.path
      const currentIndex = path.indexOf(result.current.currentStep)
      expect(currentIndex === path.length - 1).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle flow with many steps', () => {
      const manyStepsFlow = createFormFlow({
        id: 'many-steps',
        steps: {
          step1: { schema: z.object({ v: z.string() }), next: 'step2' },
          step2: { schema: z.object({ v: z.string() }), next: 'step3' },
          step3: { schema: z.object({ v: z.string() }), next: 'step4' },
          step4: { schema: z.object({ v: z.string() }), next: 'step5' },
          step5: { schema: z.object({ v: z.string() }), next: null },
        },
        initial: 'step1',
      })

      const initialData = {
        step1: { v: 'a' },
        step2: { v: 'b' },
        step3: { v: 'c' },
        step4: { v: 'd' },
      }

      const { result } = renderHook(() => useFormFlow(manyStepsFlow, { initialData }))

      expect(result.current.path.length).toBe(5)
    })

    it('should handle branching with dynamic path recalculation', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Start at 'start'
      const initialPath = result.current.path
      const initialIndex = initialPath.indexOf(result.current.currentStep)
      expect(initialIndex === 0).toBe(true) // isFirstStep
      expect(initialIndex === initialPath.length - 1).toBe(true) // isLastStep (only 'start' in path)

      // Set data to reveal branchA
      act(() => {
        result.current.setData('start', { type: 'a' })
      })

      expect(result.current.path.length).toBe(2)

      // Complete branchA to reveal 'end'
      act(() => {
        result.current.setData('branchA', { valueA: 'test' })
      })

      expect(result.current.path.length).toBe(3)
    })

    it('should recalculate path when data changes for branching step', () => {
      const { result } = renderHook(() => useFormFlow(branchingFlow))

      // Choose branch A
      act(() => {
        result.current.setData('start', { type: 'a' })
      })
      expect(result.current.path).toContain('branchA')
      expect(result.current.path).not.toContain('branchB')

      // Change to branch B
      act(() => {
        result.current.setData('start', { type: 'b' })
      })
      expect(result.current.path).toContain('branchB')
      expect(result.current.path).not.toContain('branchA')
    })
  })
})
