import type { AnyStepDefinition, FlowDefinition } from '../types/flow'
import type { InferStepIds, PartialFlowData } from '../types/schema'

export function resolveTransition<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  flow: TFlow,
  currentStep: InferStepIds<TFlow>,
  stepData: unknown,
  allData: PartialFlowData<TFlow>
): InferStepIds<TFlow> | null {
  const step = flow.steps[currentStep]

  if (!step) {
    return null
  }

  const next = step.next

  if (typeof next === 'function') {
    return next(stepData, allData) as InferStepIds<TFlow> | null
  }

  return next as InferStepIds<TFlow> | null
}

export function canNavigateToStep<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  _flow: TFlow,
  targetStep: InferStepIds<TFlow>,
  completedSteps: Set<InferStepIds<TFlow>>,
  path: InferStepIds<TFlow>[]
): boolean {
  // Can always go to completed steps that are in the current path
  if (completedSteps.has(targetStep) && path.includes(targetStep)) {
    return true
  }

  // Can go to the next uncompleted step in the path
  const currentIndex = path.findIndex((step) => !completedSteps.has(step))
  const targetIndex = path.indexOf(targetStep)

  if (targetIndex === -1) {
    return false
  }

  // Can navigate to completed steps or the next step
  return targetIndex <= currentIndex || targetIndex === 0
}

export function getNextStep<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  currentStep: InferStepIds<TFlow>,
  path: InferStepIds<TFlow>[]
): InferStepIds<TFlow> | null {
  const currentIndex = path.indexOf(currentStep)

  if (currentIndex === -1 || currentIndex === path.length - 1) {
    return null
  }

  const nextStep = path[currentIndex + 1]
  return nextStep ?? null
}

export function getPreviousStep<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  currentStep: InferStepIds<TFlow>,
  path: InferStepIds<TFlow>[]
): InferStepIds<TFlow> | null {
  const currentIndex = path.indexOf(currentStep)

  if (currentIndex <= 0) {
    return null
  }

  const prevStep = path[currentIndex - 1]
  return prevStep ?? null
}
