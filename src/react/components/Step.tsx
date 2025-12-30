'use client'

import type { AnyStepDefinition, FlowDefinition, InferStepIds } from '../../core'
import type * as React from 'react'
import type { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form'
import { useFormFlowContext } from '../context'

export interface StepRenderProps {
  register: UseFormRegister<FieldValues>
  errors: FieldErrors
  submit: (e?: React.BaseSyntheticEvent) => Promise<void>
  back: () => void
  canGoBack: boolean
  isSubmitting: boolean
  isLastStep: boolean
}

export interface StepProps<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  name: InferStepIds<TFlow>
  children: (props: StepRenderProps) => React.ReactNode
}

export function Step<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>({
  name,
  children,
}: StepProps<TFlow>): React.ReactElement | null {
  const context = useFormFlowContext<TFlow>()

  // Only render if this is the current step
  if (context.currentStep !== name) {
    return null
  }

  const handleSubmit = async (e?: React.BaseSyntheticEvent): Promise<void> => {
    if (e) {
      e.preventDefault()
    }
    await context.next()
  }

  const isLastStep = context.path.indexOf(name) === context.path.length - 1

  const renderProps: StepRenderProps = {
    register: context.form.register,
    errors: context.form.formState.errors,
    submit: handleSubmit,
    back: context.back,
    canGoBack: context.canGoBack,
    isSubmitting: context.isSubmitting,
    isLastStep,
  }

  return <>{children(renderProps)}</>
}
