'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  FormFlow,
  InferFlowData,
  InferStepIds,
  PartialFlowData,
} from '@formachine/core'
import { canNavigateToStep, getNextStep, getPreviousStep } from '@formachine/core'
import type * as React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useMemo } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

const isSyntheticEvent = (value: unknown): value is React.SyntheticEvent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'nativeEvent' in value &&
    'preventDefault' in value &&
    typeof (value as React.SyntheticEvent).preventDefault === 'function'
  )
}

export interface UseFormFlowNavigationResult<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  goTo: (step: InferStepIds<TFlow>) => void
  back: () => void
  reset: (input?: PartialFlowData<TFlow>) => void
  canGoTo: (step: InferStepIds<TFlow>) => boolean
  canGoBack: boolean
  canGoNext: boolean
}

export function useFormFlowNavigation<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  state: FlowState<TFlow>,
  setState: Dispatch<SetStateAction<FlowState<TFlow>>>,
  form: UseFormReturn<FieldValues, unknown, unknown>
): UseFormFlowNavigationResult<TFlow> {
  const goTo = useCallback(
    (step: InferStepIds<TFlow>) => {
      const canNavigate = canNavigateToStep(
        formFlow.definition as TFlow,
        step,
        state.completedSteps,
        state.path
      )

      if (canNavigate) {
        setState((prev) => ({
          ...prev,
          currentStep: step,
          history: [...prev.history, step],
        }))
        form.reset(state.data[step] ?? {})
      }
    },
    [formFlow.definition, state.completedSteps, state.path, state.data, setState, form]
  )

  const back = useCallback(() => {
    const prevStep = getPreviousStep(state.currentStep, state.path)
    if (prevStep !== null) {
      setState((prev) => ({
        ...prev,
        currentStep: prevStep,
        history: [...prev.history, prevStep],
      }))
      form.reset(state.data[prevStep] ?? {})
    }
  }, [state.currentStep, state.path, state.data, setState, form])

  const reset = useCallback(
    (input?: PartialFlowData<TFlow>) => {
      const newState = formFlow.getInitialState() as FlowState<TFlow>

      let data = input

      if (isSyntheticEvent(input)) {
        input.preventDefault?.()
        data = undefined
      }

      if (data) {
        setState({
          ...newState,
          data,
          path: formFlow.calculatePath(data),
        })
        form.reset(data[newState.currentStep] ?? {})
      } else {
        setState(newState)
        form.reset(newState.data[newState.currentStep] ?? {})
      }
    },
    [formFlow, setState, form]
  )

  const canGoTo = useCallback(
    (step: InferStepIds<TFlow>): boolean => {
      return canNavigateToStep(formFlow.definition as TFlow, step, state.completedSteps, state.path)
    },
    [formFlow.definition, state.completedSteps, state.path]
  )

  const canGoBack = useMemo(() => {
    return getPreviousStep(state.currentStep, state.path) !== null
  }, [state.currentStep, state.path])

  const canGoNext = useMemo(() => {
    return (
      getNextStep(state.currentStep, state.path) !== null ||
      !state.completedSteps.has(state.currentStep)
    )
  }, [state.currentStep, state.path, state.completedSteps])

  return { goTo, back, reset, canGoTo, canGoBack, canGoNext }
}
