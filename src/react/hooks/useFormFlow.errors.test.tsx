import { createFormFlow } from '../../core'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from './useFormFlow'

/**
 * Tests for error handling in useFormFlow
 */
describe('useFormFlow - error handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  const testFlow = createFormFlow({
    id: 'error-flow',
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
        next: null,
      },
    },
    initial: 'step1',
  })

  describe('error handling without onError callback', () => {
    it('should log error to console in development mode when exception occurs', async () => {
      process.env.NODE_ENV = 'development'

      // Create a flow that throws during validation
      const throwingFlow = createFormFlow({
        id: 'throwing-flow',
        steps: {
          step1: {
            schema: z.object({
              value: z.string(),
            }).refine(() => {
              throw new Error('Validation threw an error')
            }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() => useFormFlow(throwingFlow))

      act(() => {
        result.current.form.setValue('value', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.state.status).toBe('error')
      // Console.error should be called in development when exception occurs
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should not log error to console in production mode when exception occurs', async () => {
      process.env.NODE_ENV = 'production'

      const throwingFlow = createFormFlow({
        id: 'throwing-flow-prod',
        steps: {
          step1: {
            schema: z.object({
              value: z.string(),
            }).refine(() => {
              throw new Error('Validation threw an error')
            }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() => useFormFlow(throwingFlow))

      act(() => {
        result.current.form.setValue('value', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.state.status).toBe('error')
      // Console.error should not be called in production
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('error handling with onError callback', () => {
    it('should call onError callback when exception occurs', async () => {
      const onError = vi.fn()

      const throwingFlow = createFormFlow({
        id: 'error-callback-flow',
        steps: {
          step1: {
            schema: z.object({
              value: z.string(),
            }).refine(() => {
              throw new Error('Test error')
            }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() =>
        useFormFlow(throwingFlow, {
          onError,
        })
      )

      act(() => {
        result.current.form.setValue('value', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.state.status).toBe('error')
      expect(onError).toHaveBeenCalled()
      // Should not log to console when onError is provided
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should convert non-Error objects to Error in onError', async () => {
      const onError = vi.fn()

      const flowWithNonErrorThrow = createFormFlow({
        id: 'non-error-throw-flow',
        steps: {
          step1: {
            schema: z.object({
              value: z.string(),
            }).refine(() => {
              // eslint-disable-next-line no-throw-literal
              throw 'String error'
            }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() =>
        useFormFlow(flowWithNonErrorThrow, {
          onError,
        })
      )

      act(() => {
        result.current.form.setValue('value', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(onError).toHaveBeenCalled()
      const errorArg = onError.mock.calls[0]?.[0]
      expect(errorArg).toBeInstanceOf(Error)
    })
  })

  describe('error handling in different scenarios', () => {
    it('should handle validation errors (normal validation failures)', async () => {
      const { result } = renderHook(() => useFormFlow(testFlow))

      // Trigger validation error
      act(() => {
        result.current.form.setValue('name', 'X')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Status is 'error' but onError callback is NOT called for normal validation failures
      expect(result.current.state.status).toBe('error')
    })

    it('should handle async validation errors (normal validation failures)', async () => {
      const asyncFlow = createFormFlow({
        id: 'async-error-flow',
        steps: {
          step1: {
            schema: z
              .object({
                username: z.string(),
              })
              .refine(
                async (data) => {
                  await new Promise((resolve) => setTimeout(resolve, 10))
                  return data.username !== 'invalid'
                },
                { message: 'Invalid username' }
              ),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() => useFormFlow(asyncFlow))

      act(() => {
        result.current.form.setValue('username', 'invalid')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      expect(result.current.state.status).toBe('error')
    })

    it('should maintain error state until next navigation attempt', async () => {
      const { result } = renderHook(() => useFormFlow(testFlow))

      // First attempt - invalid data
      act(() => {
        result.current.form.setValue('name', 'X')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.state.status).toBe('error')

      // Fix the data
      act(() => {
        result.current.form.setValue('name', 'John')
      })

      // Second attempt - should succeed and clear error
      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(true)
      })

      expect(result.current.state.status).toBe('idle')
      expect(result.current.currentStep).toBe('step2')
    })
  })

  describe('error handling with optimistic navigation', () => {
    it('should handle validation failures correctly with optimistic navigation', async () => {
      const { result } = renderHook(() =>
        useFormFlow(testFlow, {
          optimisticNavigation: true,
        })
      )

      // Set invalid data
      act(() => {
        result.current.form.setValue('name', 'X')
      })

      await act(async () => {
        const success = await result.current.next()
        expect(success).toBe(false)
      })

      // Should be back on step1 after validation failure
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
    })

    it('should call onError when exception occurs during optimistic navigation', async () => {
      const onError = vi.fn()

      const throwingFlow = createFormFlow({
        id: 'throwing-optimistic-flow',
        steps: {
          step1: {
            schema: z.object({
              value: z.string(),
            }).refine(() => {
              throw new Error('Exception during validation')
            }),
            next: 'step2',
          },
          step2: {
            schema: z.object({ email: z.string() }),
            next: null,
          },
        },
        initial: 'step1',
      })

      const { result } = renderHook(() =>
        useFormFlow(throwingFlow, {
          optimisticNavigation: true,
          onError,
        })
      )

      act(() => {
        result.current.form.setValue('value', 'test')
      })

      await act(async () => {
        await result.current.next()
      })

      // Should be back on step1 after exception
      expect(result.current.currentStep).toBe('step1')
      expect(result.current.state.status).toBe('error')
      expect(onError).toHaveBeenCalled()
    })
  })
})
