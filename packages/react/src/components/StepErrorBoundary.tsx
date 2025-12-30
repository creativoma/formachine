'use client'

import * as React from 'react'

export interface StepErrorBoundaryProps {
  children: React.ReactNode
  stepId: string
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode)
  onError?: (error: Error, stepId: string, errorInfo: React.ErrorInfo) => void
  /**
   * CSS class name for the error container
   */
  errorClassName?: string
  /**
   * CSS class name for the error details
   */
  detailsClassName?: string
}

interface StepErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for individual form steps.
 * Catches errors that occur within a specific step and provides recovery options.
 *
 * @example
 * ```tsx
 * <StepErrorBoundary
 *   stepId="payment"
 *   errorClassName="error-container"
 *   fallback={(error, reset) => (
 *     <div>
 *       <h2>Something went wrong</h2>
 *       <p>{error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 *   onError={(error, stepId) => {
 *     console.error(`Error in step ${stepId}:`, error)
 *   }}
 * >
 *   <Step name="payment">...</Step>
 * </StepErrorBoundary>
 * ```
 */
export class StepErrorBoundary extends React.Component<
  StepErrorBoundaryProps,
  StepErrorBoundaryState
> {
  constructor(props: StepErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): StepErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError, stepId } = this.props
    if (onError) {
      onError(error, stepId, errorInfo)
    }
  }

  override componentDidUpdate(prevProps: StepErrorBoundaryProps): void {
    // Reset error state when step changes
    if (prevProps.stepId !== this.props.stepId && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): React.ReactNode {
    const { hasError, error } = this.state
    const { children, fallback, errorClassName, detailsClassName } = this.props

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset)
      }

      if (fallback) {
        return fallback
      }

      // Default fallback UI - minimal, unstyled for user customization
      return (
        <div className={errorClassName} data-formachine-error>
          <h2>Something went wrong</h2>
          <details className={detailsClassName}>
            <summary>Error details</summary>
            <pre>{error.message}</pre>
            {error.stack && (
              <pre>
                <code>{error.stack}</code>
              </pre>
            )}
          </details>
          <button type="button" onClick={this.reset}>
            Try again
          </button>
        </div>
      )
    }

    return children
  }
}

/**
 * Hook to create an error boundary wrapper for a step.
 * Returns a component that wraps children with error boundary.
 */
export function useStepErrorBoundary(
  stepId: string,
  options: {
    fallback?: StepErrorBoundaryProps['fallback']
    onError?: StepErrorBoundaryProps['onError']
    errorClassName?: string
    detailsClassName?: string
  } = {}
): (children: React.ReactNode) => React.ReactElement {
  return React.useCallback(
    (children: React.ReactNode) => (
      <StepErrorBoundary stepId={stepId} {...options}>
        {children}
      </StepErrorBoundary>
    ),
    [stepId, options]
  )
}
