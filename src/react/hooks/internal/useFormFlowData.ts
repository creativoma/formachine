'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  FormFlow,
  InferFlowData,
  InferStepIds,
  PartialFlowData,
} from '../../../core'
import { calculatePath } from '../../../core'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback } from 'react'

export interface UseFormFlowDataResult<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  setData: <TStep extends InferStepIds<TFlow>>(
    step: TStep,
    data: PartialFlowData<TFlow>[TStep]
  ) => void
  getData: <TStep extends InferStepIds<TFlow>>(step: TStep) => PartialFlowData<TFlow>[TStep]
  updatePath: (newData: PartialFlowData<TFlow>) => InferStepIds<TFlow>[]
}

export function useFormFlowData<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  state: FlowState<TFlow>,
  setState: Dispatch<SetStateAction<FlowState<TFlow>>>
): UseFormFlowDataResult<TFlow> {
  const updatePath = useCallback(
    (newData: PartialFlowData<TFlow>) => {
      return calculatePath(formFlow.definition as TFlow, newData) as InferStepIds<TFlow>[]
    },
    [formFlow.definition]
  )

  const setData = useCallback(
    <TStep extends InferStepIds<TFlow>>(step: TStep, data: PartialFlowData<TFlow>[TStep]) => {
      setState((prev) => {
        const newData = { ...prev.data, [step]: data }
        const newPath = updatePath(newData)

        // Invalidate steps that are no longer in the path
        const validSteps = new Set(newPath)
        const newCompletedSteps = new Set<InferStepIds<TFlow>>()
        for (const completedStep of prev.completedSteps) {
          if (validSteps.has(completedStep)) {
            newCompletedSteps.add(completedStep)
          }
        }

        return {
          ...prev,
          data: newData,
          path: newPath,
          completedSteps: newCompletedSteps,
        }
      })
    },
    [setState, updatePath]
  )

  const getData = useCallback(
    <TStep extends InferStepIds<TFlow>>(step: TStep): PartialFlowData<TFlow>[TStep] => {
      return state.data[step]
    },
    [state.data]
  )

  return { setData, getData, updatePath }
}
