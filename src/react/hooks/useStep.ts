'use client'

import { useMemo } from 'react'
import type { AnyStepDefinition, FlowDefinition, InferStepIds } from '../../core'
import { useFormFlowContext } from '../context'

export interface UseStepResult<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  stepId: InferStepIds<TFlow>
  isActive: boolean
  isCompleted: boolean
  isReachable: boolean
  data: unknown
}

export function useStep<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  stepId: InferStepIds<TFlow>
): UseStepResult<TFlow> {
  const context = useFormFlowContext<TFlow>()

  const isActive = context.currentStep === stepId
  const isCompleted = context.completedSteps.has(stepId)
  const isReachable = context.path.includes(stepId)
  const data = context.getData(stepId)

  return useMemo(
    () => ({
      stepId,
      isActive,
      isCompleted,
      isReachable,
      data,
    }),
    [stepId, isActive, isCompleted, isReachable, data]
  )
}
