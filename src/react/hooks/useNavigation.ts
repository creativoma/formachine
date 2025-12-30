'use client'

import type { AnyStepDefinition, FlowDefinition, InferStepIds } from '../../core'
import { useMemo } from 'react'
import { useFormFlowContext } from '../context'

export interface UseNavigationResult<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  currentStep: InferStepIds<TFlow>
  completedSteps: Set<InferStepIds<TFlow>>
  goTo: (step: InferStepIds<TFlow>) => void
  canGoTo: (step: InferStepIds<TFlow>) => boolean
  next: () => Promise<boolean>
  back: () => void
  canGoBack: boolean
  canGoNext: boolean
  isSubmitting: boolean
}

export function useNavigation<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
>(): UseNavigationResult<TFlow> {
  const context = useFormFlowContext<TFlow>()

  return useMemo(
    () => ({
      currentStep: context.currentStep,
      completedSteps: context.completedSteps,
      goTo: context.goTo,
      canGoTo: context.canGoTo,
      next: context.next,
      back: context.back,
      canGoBack: context.canGoBack,
      canGoNext: context.canGoNext,
      isSubmitting: context.isSubmitting,
    }),
    [
      context.currentStep,
      context.completedSteps,
      context.goTo,
      context.canGoTo,
      context.next,
      context.back,
      context.canGoBack,
      context.canGoNext,
      context.isSubmitting,
    ]
  )
}
