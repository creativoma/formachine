'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FormFlow,
  InferFlowData,
  InferStepIds,
  PartialFlowData,
} from '@formachine/core'
import type { FormFlowContextValue } from '../context'
import { useFormFlowData } from './internal/useFormFlowData'
import { useFormFlowForm } from './internal/useFormFlowForm'
import { useFormFlowNavigation } from './internal/useFormFlowNavigation'
import { useFormFlowNext } from './internal/useFormFlowNext'
import { useFormFlowState } from './internal/useFormFlowState'
import { useFormFlowTransitions } from './internal/useFormFlowTransitions'

export interface UseFormFlowOptions<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  onComplete?: (data: InferFlowData<TFlow>) => void | Promise<void>
  onStepComplete?: (stepId: InferStepIds<TFlow>, stepData: unknown) => void | Promise<void>
  onError?: (error: Error) => void
  initialData?: PartialFlowData<TFlow>
  optimisticNavigation?: boolean
}

export function useFormFlow<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  options: UseFormFlowOptions<TFlow> = {}
): FormFlowContextValue<TFlow> {
  const { onComplete, onStepComplete, onError, initialData, optimisticNavigation = false } = options

  // Initialize state
  const { state, setState } = useFormFlowState(formFlow, initialData)

  // Initialize form
  const form = useFormFlowForm(formFlow, state.currentStep, state.data[state.currentStep])

  // Data operations
  const data = useFormFlowData(formFlow, state, setState)

  // Transitions and callbacks
  const transitions = useFormFlowTransitions(setState, {
    onStepComplete,
    onComplete,
    onError,
  })

  // Navigation
  const navigation = useFormFlowNavigation(formFlow, state, setState, form)

  // Next function
  const { next } = useFormFlowNext(formFlow, state, setState, form, data, transitions, {
    optimisticNavigation,
  })

  const isSubmitting = state.status === 'submitting'
  const isComplete = state.status === 'complete'

  return {
    flow: formFlow,
    state,
    currentStep: state.currentStep,
    goTo: navigation.goTo,
    next,
    back: navigation.back,
    reset: navigation.reset,
    canGoTo: navigation.canGoTo,
    canGoBack: navigation.canGoBack,
    canGoNext: navigation.canGoNext,
    getData: data.getData,
    setData: data.setData,
    path: state.path,
    completedSteps: state.completedSteps,
    isSubmitting,
    isComplete,
    form,
  }
}
