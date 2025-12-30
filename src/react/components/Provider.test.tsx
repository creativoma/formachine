import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createFormFlow } from '../../core'
import { useFormFlowContext } from '../context'
import { useFormFlow } from '../hooks/useFormFlow'
import { FormFlowProvider } from './Provider'

describe('FormFlowProvider', () => {
  const testFlow = createFormFlow({
    id: 'test-flow',
    steps: {
      step1: {
        schema: z.object({ name: z.string() }),
        next: null,
      },
    },
    initial: 'step1',
  })

  function TestConsumer() {
    const context = useFormFlowContext()
    return <div>Current Step: {context.currentStep}</div>
  }

  it('should provide context to children', () => {
    function TestWrapper() {
      const formFlow = useFormFlow(testFlow)
      return (
        <FormFlowProvider value={formFlow}>
          <TestConsumer />
        </FormFlowProvider>
      )
    }

    render(<TestWrapper />)
    expect(screen.getByText('Current Step: step1')).toBeInTheDocument()
  })

  it('should render children', () => {
    function TestWrapper() {
      const formFlow = useFormFlow(testFlow)
      return (
        <FormFlowProvider value={formFlow}>
          <div>Test Content</div>
        </FormFlowProvider>
      )
    }

    render(<TestWrapper />)
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
