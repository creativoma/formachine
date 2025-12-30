'use client'

import type { AnyStepDefinition, FlowDefinition, InferStepIds } from '@formachine/core'
import type * as React from 'react'
import { useFormFlowContext } from '../context'

export interface GuardProps<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  /** Only render children if this step is in the current path */
  step?: InferStepIds<TFlow>
  /** Only render children if this step is completed */
  completed?: InferStepIds<TFlow>
  /** Only render children if this step is the current step */
  active?: InferStepIds<TFlow>
  /** Invert the condition */
  not?: boolean
  /** Children to render */
  children: React.ReactNode
  /** Fallback to render when condition is not met */
  fallback?: React.ReactNode
}

export function Guard<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>({
  step,
  completed,
  active,
  not = false,
  children,
  fallback = null,
}: GuardProps<TFlow>): React.ReactElement | null {
  const context = useFormFlowContext<TFlow>()

  let condition = true

  if (step !== undefined) {
    condition = context.path.includes(step)
  }

  if (completed !== undefined) {
    condition = condition && context.completedSteps.has(completed)
  }

  if (active !== undefined) {
    condition = condition && context.currentStep === active
  }

  if (not) {
    condition = !condition
  }

  if (condition) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
