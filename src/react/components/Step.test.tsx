import { createFormFlow } from '../../core'
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { useFormFlow } from '../hooks/useFormFlow'
import { FormFlowProvider } from './Provider'
import { Step, type StepRenderProps } from './Step'

describe('Step', () => {
  const testFlow = createFormFlow({
    id: 'test-flow',
    steps: {
      step1: {
        schema: z.object({ name: z.string() }),
        next: 'step2',
      },
      step2: {
        schema: z.object({ email: z.string() }),
        next: null,
      },
    },
    initial: 'step1',
  })

  function TestWrapper({ children }: { children: React.ReactNode }) {
    const formFlow = useFormFlow(testFlow)
    return <FormFlowProvider value={formFlow}>{children}</FormFlowProvider>
  }

  it('should render current step', () => {
    render(
      <TestWrapper>
        <Step name="step1">{() => <div>Step 1 Content</div>}</Step>
        <Step name="step2">{() => <div>Step 2 Content</div>}</Step>
      </TestWrapper>
    )

    expect(screen.getByText('Step 1 Content')).toBeInTheDocument()
    expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument()
  })

  it('should provide form props to render function', () => {
    const renderFn = vi.fn((_props: StepRenderProps): ReactNode => <div>Content</div>)

    render(
      <TestWrapper>
        <Step name="step1">{renderFn}</Step>
      </TestWrapper>
    )

    expect(renderFn).toHaveBeenCalled()
    const call = renderFn.mock.calls[0]
    const props = call?.[0]
    expect(props).toBeDefined()

    expect(props).toHaveProperty('register')
    expect(props).toHaveProperty('errors')
    expect(props).toHaveProperty('submit')
    expect(props).toHaveProperty('back')
    expect(props).toHaveProperty('canGoBack')
    expect(props).toHaveProperty('isSubmitting')
    expect(props).toHaveProperty('isLastStep')
  })

  it('should indicate first step cannot go back', () => {
    const renderFn = vi.fn((_props: StepRenderProps): ReactNode => <div>Content</div>)

    render(
      <TestWrapper>
        <Step name="step1">{renderFn}</Step>
      </TestWrapper>
    )

    const call = renderFn.mock.calls[0]
    const props = call?.[0]
    expect(props).toBeDefined()
    expect(props?.canGoBack).toBe(false)
  })

  it('should provide submit handler', () => {
    const renderFn = vi.fn((_props: StepRenderProps): ReactNode => <div>Content</div>)

    render(
      <TestWrapper>
        <Step name="step1">{renderFn}</Step>
      </TestWrapper>
    )

    const call = renderFn.mock.calls[0]
    const props = call?.[0]
    expect(props).toBeDefined()
    expect(typeof props?.submit).toBe('function')
  })

  it('should not render non-current step', () => {
    render(
      <TestWrapper>
        <Step name="step2">{() => <div>Step 2 Content</div>}</Step>
      </TestWrapper>
    )

    expect(screen.queryByText('Step 2 Content')).not.toBeInTheDocument()
  })

  it('should provide isLastStep flag', () => {
    const renderFn = vi.fn((_props: StepRenderProps): ReactNode => <div>Content</div>)

    render(
      <TestWrapper>
        <Step name="step1">{renderFn}</Step>
      </TestWrapper>
    )

    const call = renderFn.mock.calls[0]
    const props = call?.[0]
    expect(props).toBeDefined()
    // step1 is the last step in the current path (only step with no data for step2)
    expect(props?.isLastStep).toBe(true)
  })

  it('should call preventDefault when submit is called with event', async () => {
    let capturedProps: StepRenderProps | null = null

    render(
      <TestWrapper>
        <Step name="step1">
          {(props) => {
            capturedProps = props
            return <div>Content</div>
          }}
        </Step>
      </TestWrapper>
    )

    expect(capturedProps).not.toBeNull()

    const mockEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.BaseSyntheticEvent

    await act(async () => {
      await capturedProps?.submit(mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it('should handle submit without event', async () => {
    let capturedProps: StepRenderProps | null = null

    render(
      <TestWrapper>
        <Step name="step1">
          {(props) => {
            capturedProps = props
            return <div>Content</div>
          }}
        </Step>
      </TestWrapper>
    )

    expect(capturedProps).not.toBeNull()

    // Should not throw when called without event
    await act(async () => {
      await capturedProps?.submit()
    })
  })
})
