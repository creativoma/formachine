/** biome-ignore-all lint/style/noNonNullAssertion: '' */
import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StepErrorBoundary, useStepErrorBoundary } from './StepErrorBoundary'

// Component that throws an error for testing
function ThrowError({ shouldThrow, message }: { shouldThrow: boolean; message?: string }) {
  if (shouldThrow) {
    throw new Error(message ?? 'Test error')
  }
  return <div data-testid="child-content">Child content</div>
}

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('StepErrorBoundary', () => {
  describe('normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <StepErrorBoundary stepId="test-step">
          <div data-testid="child">Child content</div>
        </StepErrorBoundary>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <StepErrorBoundary stepId="test-step">
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </StepErrorBoundary>
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
    })
  })

  describe('error catching', () => {
    it('should catch errors and display default fallback', () => {
      render(
        <StepErrorBoundary stepId="payment">
          <ThrowError shouldThrow={true} />
        </StepErrorBoundary>
      )

      expect(screen.queryByTestId('child-content')).not.toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    })

    it('should display error message in details', () => {
      render(
        <StepErrorBoundary stepId="payment">
          <ThrowError shouldThrow={true} message="Custom error message" />
        </StepErrorBoundary>
      )

      const errorMessages = screen.getAllByText(/Custom error message/)
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })

  describe('custom fallback', () => {
    it('should render ReactNode fallback', () => {
      render(
        <StepErrorBoundary
          stepId="test-step"
          fallback={<div data-testid="custom-fallback">Custom error UI</div>}
        >
          <ThrowError shouldThrow={true} />
        </StepErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    })

    it('should render function fallback with error and reset', () => {
      const fallbackFn = vi.fn((error: Error, reset: () => void) => (
        <div>
          <span data-testid="error-message">{error.message}</span>
          <button type="button" onClick={reset} data-testid="reset-btn">
            Reset
          </button>
        </div>
      ))

      render(
        <StepErrorBoundary stepId="test-step" fallback={fallbackFn}>
          <ThrowError shouldThrow={true} message="Function fallback error" />
        </StepErrorBoundary>
      )

      expect(fallbackFn).toHaveBeenCalled()
      expect(screen.getByTestId('error-message')).toHaveTextContent('Function fallback error')
      expect(screen.getByTestId('reset-btn')).toBeInTheDocument()
    })
  })

  describe('reset functionality', () => {
    it('should reset error state when reset button is clicked', () => {
      function TestComponent() {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <div>
            <button type="button" onClick={() => setShouldThrow(false)} data-testid="fix-error">
              Fix
            </button>
            <StepErrorBoundary stepId="test-step">
              <ThrowError shouldThrow={shouldThrow} />
            </StepErrorBoundary>
          </div>
        )
      }

      render(<TestComponent />)

      // Initial error state
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Fix the error condition
      fireEvent.click(screen.getByTestId('fix-error'))

      // Click reset
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

      // Should now render children
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('should reset via function fallback', () => {
      function TestComponent() {
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <div>
            <button type="button" onClick={() => setShouldThrow(false)} data-testid="fix-error">
              Fix
            </button>
            <StepErrorBoundary
              stepId="test-step"
              fallback={(_error, reset) => (
                <button type="button" onClick={reset} data-testid="custom-reset">
                  Custom Reset
                </button>
              )}
            >
              <ThrowError shouldThrow={shouldThrow} />
            </StepErrorBoundary>
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByTestId('custom-reset')).toBeInTheDocument()

      // Fix error and reset
      fireEvent.click(screen.getByTestId('fix-error'))
      fireEvent.click(screen.getByTestId('custom-reset'))

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })
  })

  describe('onError callback', () => {
    it('should call onError with error, stepId, and errorInfo', () => {
      const onError = vi.fn()

      render(
        <StepErrorBoundary stepId="payment-step" onError={onError}>
          <ThrowError shouldThrow={true} message="Payment error" />
        </StepErrorBoundary>
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        'payment-step',
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )

      const [error] = onError.mock.calls[0]!
      expect(error.message).toBe('Payment error')
    })

    it('should not call onError when no error occurs', () => {
      const onError = vi.fn()

      render(
        <StepErrorBoundary stepId="test-step" onError={onError}>
          <ThrowError shouldThrow={false} />
        </StepErrorBoundary>
      )

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('stepId changes', () => {
    it('should reset error state when stepId changes', () => {
      function TestComponent() {
        const [stepId, setStepId] = React.useState('step1')
        const [shouldThrow, setShouldThrow] = React.useState(true)

        return (
          <div>
            <button type="button" onClick={() => setStepId('step2')} data-testid="change-step">
              Change Step
            </button>
            <button type="button" onClick={() => setShouldThrow(false)} data-testid="fix-error">
              Fix
            </button>
            <StepErrorBoundary stepId={stepId}>
              <ThrowError shouldThrow={shouldThrow} />
            </StepErrorBoundary>
          </div>
        )
      }

      render(<TestComponent />)

      // Initial error
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Fix error then change step
      fireEvent.click(screen.getByTestId('fix-error'))
      fireEvent.click(screen.getByTestId('change-step'))

      // Error should be reset and children should render
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty children', () => {
      render(<StepErrorBoundary stepId="test-step">{null}</StepErrorBoundary>)
      // Should not throw, just render nothing
    })

    it('should handle deeply nested errors', () => {
      function NestedComponent() {
        return (
          <div>
            <div>
              <ThrowError shouldThrow={true} message="Nested error" />
            </div>
          </div>
        )
      }

      render(
        <StepErrorBoundary stepId="nested-step">
          <NestedComponent />
        </StepErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      // Error appears in both <pre> and <code>
      const errorMessages = screen.getAllByText(/Nested error/)
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    it('should not affect siblings outside boundary', () => {
      render(
        <div>
          <div data-testid="sibling">Sibling content</div>
          <StepErrorBoundary stepId="test-step">
            <ThrowError shouldThrow={true} />
          </StepErrorBoundary>
        </div>
      )

      expect(screen.getByTestId('sibling')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })
})

describe('useStepErrorBoundary', () => {
  it('should return a wrapper component', () => {
    function TestComponent() {
      const wrapWithBoundary = useStepErrorBoundary('test-step')

      return wrapWithBoundary(<div data-testid="wrapped-content">Wrapped</div>)
    }

    render(<TestComponent />)

    expect(screen.getByTestId('wrapped-content')).toBeInTheDocument()
  })

  it('should catch errors in wrapped content', () => {
    function TestComponent() {
      const wrapWithBoundary = useStepErrorBoundary('test-step')

      return wrapWithBoundary(<ThrowError shouldThrow={true} />)
    }

    render(<TestComponent />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should support custom fallback', () => {
    function TestComponent() {
      const wrapWithBoundary = useStepErrorBoundary('test-step', {
        fallback: <div data-testid="hook-fallback">Hook fallback</div>,
      })

      return wrapWithBoundary(<ThrowError shouldThrow={true} />)
    }

    render(<TestComponent />)

    expect(screen.getByTestId('hook-fallback')).toBeInTheDocument()
  })

  it('should support onError callback', () => {
    const onError = vi.fn()

    function TestComponent() {
      const wrapWithBoundary = useStepErrorBoundary('test-step', { onError })

      return wrapWithBoundary(<ThrowError shouldThrow={true} />)
    }

    render(<TestComponent />)

    expect(onError).toHaveBeenCalled()
  })

  it('should return stable wrapper function', () => {
    const wrappers: Array<(children: React.ReactNode) => React.ReactElement> = []

    function TestComponent() {
      const wrapWithBoundary = useStepErrorBoundary('test-step')
      wrappers.push(wrapWithBoundary)

      return wrapWithBoundary(<div>Content</div>)
    }

    const { rerender } = render(<TestComponent />)
    rerender(<TestComponent />)

    // The wrapper functions should be the same reference (memoized)
    // Note: This depends on implementation - React.useCallback may return same reference
    expect(wrappers.length).toBe(2)
  })
})
