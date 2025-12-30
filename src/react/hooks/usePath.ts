'use client'

import type { AnyStepDefinition, FlowDefinition, InferStepIds } from '../../core'
import { useMemo } from 'react'
import { useFormFlowContext } from '../context'

export interface UsePathResult<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  reachablePath: InferStepIds<TFlow>[]
  totalSteps: number
  currentIndex: number
  progress: number
  isLastStep: boolean
  isFirstStep: boolean
}

export function usePath<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
>(): UsePathResult<TFlow> {
  const context = useFormFlowContext<TFlow>()

  return useMemo(() => {
    const currentIndex = context.path.indexOf(context.currentStep)
    const totalSteps = context.path.length
    const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0

    return {
      reachablePath: context.path,
      totalSteps,
      currentIndex,
      progress,
      isLastStep: currentIndex === totalSteps - 1,
      isFirstStep: currentIndex === 0,
    }
  }, [context.path, context.currentStep])
}
