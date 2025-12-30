'use client'

import type { Dispatch, SetStateAction } from 'react'
import { useCallback } from 'react'
import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  InferFlowData,
  InferStepIds,
} from '../../../core'

export interface UseFormFlowTransitionsCallbacks<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  onStepComplete?: (stepId: InferStepIds<TFlow>, stepData: unknown) => void | Promise<void>
  onComplete?: (data: InferFlowData<TFlow>) => void | Promise<void>
  onError?: (error: Error) => void
}

export interface UseFormFlowTransitionsResult<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  markStepComplete: (stepId: InferStepIds<TFlow>, data: unknown) => Promise<void>
  markFlowComplete: (allData: InferFlowData<TFlow>) => Promise<void>
  setStatus: (status: FlowState<TFlow>['status']) => void
  handleError: (error: unknown) => void
}

export function useFormFlowTransitions<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
>(
  setState: Dispatch<SetStateAction<FlowState<TFlow>>>,
  callbacks: UseFormFlowTransitionsCallbacks<TFlow>
): UseFormFlowTransitionsResult<TFlow> {
  const { onStepComplete, onComplete, onError } = callbacks

  const markStepComplete = useCallback(
    async (stepId: InferStepIds<TFlow>, data: unknown) => {
      setState((prev) => ({
        ...prev,
        completedSteps: new Set([...prev.completedSteps, stepId]),
      }))

      if (onStepComplete) {
        await onStepComplete(stepId, data)
      }
    },
    [setState, onStepComplete]
  )

  const markFlowComplete = useCallback(
    async (allData: InferFlowData<TFlow>) => {
      setState((prev) => ({ ...prev, status: 'complete' }))

      if (onComplete) {
        await onComplete(allData)
      }
    },
    [setState, onComplete]
  )

  const setStatus = useCallback(
    (status: FlowState<TFlow>['status']) => {
      setState((prev) => ({ ...prev, status }))
    },
    [setState]
  )

  const handleError = useCallback(
    (error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error))

      setState((prev) => ({ ...prev, status: 'error' }))

      if (onError) {
        onError(errorObj)
      } else {
        try {
          // @ts-expect-error - process may not exist in browser
          if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
            console.error('[formachine] Unhandled validation error:', errorObj)
          }
        } catch {
          // Ignore in environments without process
        }
      }
    },
    [setState, onError]
  )

  return { markStepComplete, markFlowComplete, setStatus, handleError }
}
