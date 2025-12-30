import { createFormFlow } from '@formachine/core'
import { act, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from '../hooks/useFormFlow'
import { Guard } from './Guard'
import { FormFlowProvider } from './Provider'

// Helper to render Guard within FormFlowProvider
function renderWithProvider(
  ui: React.ReactNode,
  flow: ReturnType<typeof createFormFlow>,
  options?: Parameters<typeof useFormFlow>[1]
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const formFlow = useFormFlow(flow, options)
    return <FormFlowProvider value={formFlow}>{children}</FormFlowProvider>
  }

  return render(ui, { wrapper: Wrapper })
}

describe('Guard', () => {
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

  describe('step prop (in path)', () => {
    it('should render children when step is in path', () => {
      renderWithProvider(
        <Guard step="step1">
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })

    it('should not render children when step is not in path', () => {
      renderWithProvider(
        <Guard step="step3">
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
    })

    it('should render children when step becomes part of path', () => {
      const initialData = {
        step1: { name: 'John' },
      }

      renderWithProvider(
        <Guard step="step2">
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow,
        { initialData }
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })
  })

  describe('completed prop', () => {
    it('should not render children when step is not completed', () => {
      renderWithProvider(
        <Guard completed="step1">
          <div data-testid="guarded-content">Completed content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
    })

    it('should render children when step is completed', async () => {
      function TestComponent() {
        const formFlow = useFormFlow(linearFlow)

        React.useEffect(() => {
          // Simulate completing step1
          formFlow.form.setValue('name', 'John')
        }, [formFlow.form])

        return (
          <FormFlowProvider value={formFlow}>
            <button
              type="button"
              onClick={async () => {
                await formFlow.next()
              }}
              data-testid="next-btn"
            >
              Next
            </button>
            <Guard completed="step1">
              <div data-testid="guarded-content">Completed content</div>
            </Guard>
          </FormFlowProvider>
        )
      }

      render(<TestComponent />)

      // Initially not visible
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()

      // Complete step1
      await act(async () => {
        screen.getByTestId('next-btn').click()
      })

      // Now visible
      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })
  })

  describe('active prop', () => {
    it('should render children when step is active', () => {
      renderWithProvider(
        <Guard active="step1">
          <div data-testid="guarded-content">Active content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })

    it('should not render children when step is not active', () => {
      renderWithProvider(
        <Guard active="step2">
          <div data-testid="guarded-content">Active content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
    })

    it('should update when active step changes', async () => {
      function TestComponent() {
        const formFlow = useFormFlow(linearFlow)

        React.useEffect(() => {
          formFlow.form.setValue('name', 'John')
        }, [formFlow.form])

        return (
          <FormFlowProvider value={formFlow}>
            <button
              type="button"
              onClick={async () => {
                await formFlow.next()
              }}
              data-testid="next-btn"
            >
              Next
            </button>
            <Guard active="step1">
              <div data-testid="step1-active">Step 1 active</div>
            </Guard>
            <Guard active="step2">
              <div data-testid="step2-active">Step 2 active</div>
            </Guard>
          </FormFlowProvider>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId('step1-active')).toBeInTheDocument()
      expect(screen.queryByTestId('step2-active')).not.toBeInTheDocument()

      await act(async () => {
        screen.getByTestId('next-btn').click()
      })

      expect(screen.queryByTestId('step1-active')).not.toBeInTheDocument()
      expect(screen.getByTestId('step2-active')).toBeInTheDocument()
    })
  })

  describe('not prop (inversion)', () => {
    it('should invert step condition', () => {
      renderWithProvider(
        <>
          <Guard step="step1">
            <div data-testid="in-path">In path</div>
          </Guard>
          <Guard step="step1" not>
            <div data-testid="not-in-path">Not in path</div>
          </Guard>
        </>,
        linearFlow
      )

      expect(screen.getByTestId('in-path')).toBeInTheDocument()
      expect(screen.queryByTestId('not-in-path')).not.toBeInTheDocument()
    })

    it('should invert completed condition', () => {
      renderWithProvider(
        <>
          <Guard completed="step1">
            <div data-testid="completed">Completed</div>
          </Guard>
          <Guard completed="step1" not>
            <div data-testid="not-completed">Not completed</div>
          </Guard>
        </>,
        linearFlow
      )

      expect(screen.queryByTestId('completed')).not.toBeInTheDocument()
      expect(screen.getByTestId('not-completed')).toBeInTheDocument()
    })

    it('should invert active condition', () => {
      renderWithProvider(
        <>
          <Guard active="step1">
            <div data-testid="active">Active</div>
          </Guard>
          <Guard active="step1" not>
            <div data-testid="not-active">Not active</div>
          </Guard>
        </>,
        linearFlow
      )

      expect(screen.getByTestId('active')).toBeInTheDocument()
      expect(screen.queryByTestId('not-active')).not.toBeInTheDocument()
    })
  })

  describe('fallback prop', () => {
    it('should render fallback when condition is not met', () => {
      renderWithProvider(
        <Guard step="step3" fallback={<div data-testid="fallback-content">Step not available</div>}>
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument()
    })

    it('should render children instead of fallback when condition is met', () => {
      renderWithProvider(
        <Guard step="step1" fallback={<div data-testid="fallback-content">Step not available</div>}>
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
      expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument()
    })

    it('should render null when no fallback provided and condition not met', () => {
      const { container } = renderWithProvider(
        <Guard step="step3">
          <div data-testid="guarded-content">Protected content</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
      expect(container.querySelector('[data-testid="guarded-content"]')).toBeNull()
    })
  })

  describe('combined conditions', () => {
    it('should combine step and completed conditions (AND)', () => {
      const initialData = {
        step1: { name: 'John' },
      }

      // step2 is in path but not completed
      renderWithProvider(
        <Guard step="step2" completed="step2">
          <div data-testid="guarded-content">Both conditions met</div>
        </Guard>,
        linearFlow,
        { initialData }
      )

      // step2 is in path but not completed, so should not render
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
    })

    it('should show content when all combined conditions are met', async () => {
      function TestComponent() {
        const formFlow = useFormFlow(linearFlow, {
          initialData: { step1: { name: 'John' } },
        })

        return (
          <FormFlowProvider value={formFlow}>
            <button
              type="button"
              onClick={async () => {
                await formFlow.next()
              }}
              data-testid="next-btn"
            >
              Next
            </button>
            <Guard step="step1" completed="step1">
              <div data-testid="guarded-content">Step 1 in path and completed</div>
            </Guard>
          </FormFlowProvider>
        )
      }

      render(<TestComponent />)

      // step1 is in path but not completed yet
      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()

      // Complete step1
      await act(async () => {
        screen.getByTestId('next-btn').click()
      })

      // Now step1 is both in path and completed
      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })

    it('should combine step and active conditions', () => {
      renderWithProvider(
        <Guard step="step1" active="step1">
          <div data-testid="guarded-content">Step 1 active and in path</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle no conditions (always render)', () => {
      renderWithProvider(
        <Guard>
          <div data-testid="guarded-content">Always visible</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('guarded-content')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      const { container } = renderWithProvider(<Guard step="step1">{null}</Guard>, linearFlow)

      expect(container).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      renderWithProvider(
        <Guard step="step1">
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
    })

    it('should handle nested Guards', () => {
      renderWithProvider(
        <Guard step="step1">
          <Guard active="step1">
            <div data-testid="nested-content">Nested guard content</div>
          </Guard>
        </Guard>,
        linearFlow
      )

      expect(screen.getByTestId('nested-content')).toBeInTheDocument()
    })

    it('should handle non-existent step', () => {
      renderWithProvider(
        <Guard step="nonexistent">
          <div data-testid="guarded-content">Should not show</div>
        </Guard>,
        linearFlow
      )

      expect(screen.queryByTestId('guarded-content')).not.toBeInTheDocument()
    })
  })
})
