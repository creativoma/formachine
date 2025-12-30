import type { AnyStepDefinition, FlowDefinition } from '../types/flow'
import type { FlowLogger } from '../types/logger'
import { defaultLogger } from '../types/logger'
import type { InferStepIds, PartialFlowData } from '../types/schema'

export function calculatePath<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  flow: TFlow,
  data: PartialFlowData<TFlow>,
  logger: FlowLogger = defaultLogger
): InferStepIds<TFlow>[] {
  const path: InferStepIds<TFlow>[] = []
  let currentStep: InferStepIds<TFlow> | null = flow.initial as InferStepIds<TFlow>
  const visited = new Set<string>()

  while (currentStep !== null) {
    // Circular reference detection
    if (visited.has(currentStep)) {
      logger.warn('[formachine] Circular reference detected', { step: currentStep })
      break
    }
    visited.add(currentStep)

    path.push(currentStep)
    const step = flow.steps[currentStep]

    if (!step) {
      logger.warn('[formachine] Step not found', { step: currentStep })
      break
    }

    const stepData = data[currentStep]

    if (stepData === undefined) {
      // No data for this step yet, path ends here
      break
    }

    const next = step.next
    if (typeof next === 'function') {
      currentStep = next(stepData, data) as InferStepIds<TFlow> | null
    } else {
      currentStep = next as InferStepIds<TFlow> | null
    }
  }

  return path
}

export function calculateFullPath<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  flow: TFlow,
  data: PartialFlowData<TFlow>,
  logger: FlowLogger = defaultLogger
): InferStepIds<TFlow>[] {
  const path: InferStepIds<TFlow>[] = []
  let currentStep: InferStepIds<TFlow> | null = flow.initial as InferStepIds<TFlow>
  const visited = new Set<string>()

  while (currentStep !== null) {
    if (visited.has(currentStep)) {
      logger.warn('[formachine] Circular reference in full path', { step: currentStep })
      break
    }
    visited.add(currentStep)

    path.push(currentStep)
    const step = flow.steps[currentStep]

    if (!step) {
      logger.warn('[formachine] Step not found in full path', { step: currentStep })
      break
    }

    const stepData = data[currentStep]
    const next = step.next

    if (typeof next === 'function') {
      if (stepData !== undefined) {
        currentStep = next(stepData, data) as InferStepIds<TFlow> | null
      } else {
        // Cannot determine next step without data
        break
      }
    } else {
      currentStep = next as InferStepIds<TFlow> | null
    }
  }

  return path
}
