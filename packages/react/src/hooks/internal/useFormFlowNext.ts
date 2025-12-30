'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  FormFlow,
  InferFlowData,
  InferStepIds,
} from '@formachine/core'
import { getNextStep, validateStep } from '@formachine/core'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { UseFormFlowDataResult } from './useFormFlowData'
import type { UseFormFlowTransitionsResult } from './useFormFlowTransitions'

export interface UseFormFlowNextOptions {
  optimisticNavigation?: boolean
}

export interface UseFormFlowNextResult {
  next: () => Promise<boolean>
}

export function useFormFlowNext<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  state: FlowState<TFlow>,
  setState: Dispatch<SetStateAction<FlowState<TFlow>>>,
  form: UseFormReturn<FieldValues, unknown, unknown>,
  data: UseFormFlowDataResult<TFlow>,
  transitions: UseFormFlowTransitionsResult<TFlow>,
  options: UseFormFlowNextOptions
): UseFormFlowNextResult {
  const { optimisticNavigation = false } = options

  const next = useCallback(async (): Promise<boolean> => {
    const fromStep = state.currentStep
    const formData = form.getValues()
    const currentSchema = formFlow.getStepSchema(state.currentStep)

    // Calculate what the next step would be
    const tempData = { ...state.data, [state.currentStep]: formData }
    const tempPath = data.updatePath(tempData)
    const potentialNextStep = getNextStep(state.currentStep, tempPath)

    try {
      // Optimistic navigation: move to next step immediately
      if (optimisticNavigation && potentialNextStep !== null) {
        setState((prev) => ({
          ...prev,
          currentStep: potentialNextStep,
          history: [...prev.history, potentialNextStep],
          status: 'validating',
        }))
        form.reset(state.data[potentialNextStep] ?? {})
      } else {
        transitions.setStatus('validating')
      }

      // Validate in background
      const validation = await validateStep(currentSchema, formData)

      if (!validation.success) {
        // Revert to previous step if optimistic navigation was used
        if (optimisticNavigation && potentialNextStep !== null) {
          setState((prev) => ({
            ...prev,
            currentStep: fromStep,
            history: prev.history.slice(0, -1),
            status: 'error',
          }))
          form.reset(state.data[fromStep] ?? {})
        } else {
          transitions.setStatus('error')
        }
        return false
      }

      const validatedData = validation.data

      // Update data and mark step complete
      const newData = { ...state.data, [fromStep]: validatedData }
      const newPath = data.updatePath(newData)

      // Invalidate steps that are no longer in the path
      const validSteps = new Set(newPath)
      const newCompletedSteps = new Set<InferStepIds<TFlow>>()
      for (const completedStep of state.completedSteps) {
        if (validSteps.has(completedStep)) {
          newCompletedSteps.add(completedStep)
        }
      }
      newCompletedSteps.add(fromStep)

      // Call onStepComplete callback
      await transitions.markStepComplete(fromStep, validatedData)

      // Get actual next step
      const nextStep = getNextStep(fromStep, newPath)

      if (nextStep === null) {
        // Flow complete
        setState((prev) => ({
          ...prev,
          data: newData,
          path: newPath,
          completedSteps: newCompletedSteps,
          status: 'submitting',
          currentStep: fromStep,
        }))

        await transitions.markFlowComplete(newData as InferFlowData<TFlow>)

        transitions.setStatus('complete')
        return true
      }

      // Update state with validated data
      // If optimistic navigation, we're already on the next step - just update the data
      // Otherwise, move to next step now
      if (optimisticNavigation) {
        setState((prev) => ({
          ...prev,
          data: newData,
          path: newPath,
          completedSteps: newCompletedSteps,
          status: 'idle',
        }))
      } else {
        setState((prev) => ({
          ...prev,
          data: newData,
          path: newPath,
          completedSteps: newCompletedSteps,
          currentStep: nextStep,
          history: [...prev.history, nextStep],
          status: 'idle',
        }))
        form.reset(newData[nextStep] ?? {})
      }

      return true
    } catch (error) {
      // Revert to previous step if optimistic navigation was used
      if (optimisticNavigation && potentialNextStep !== null) {
        setState((prev) => ({
          ...prev,
          currentStep: fromStep,
          history: prev.history.slice(0, -1),
          status: 'error',
        }))
        form.reset(state.data[fromStep] ?? {})
      } else {
        transitions.setStatus('error')
      }

      transitions.handleError(error)

      return false
    }
  }, [formFlow, state, setState, form, data, transitions, optimisticNavigation])

  return { next }
}
