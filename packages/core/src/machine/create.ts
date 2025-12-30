import type { z } from 'zod'
import type { AnyStepDefinition, FlowDefinition, StepDefinition, Transition } from '../types/flow'
import type { FlowLogger } from '../types/logger'
import { defaultLogger } from '../types/logger'
import type { FlowStatus } from '../types/state'
import { calculatePath } from './path'

// Simplified state type for better inference
export interface SimpleFlowState<TStepKeys extends string, TData extends Record<string, unknown>> {
  currentStep: TStepKeys
  data: Partial<TData>
  completedSteps: Set<TStepKeys>
  path: TStepKeys[]
  history: TStepKeys[]
  status: FlowStatus
}

export interface FormFlow<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
  TData extends Record<TStepKeys, unknown>,
> {
  definition: {
    id: string
    steps: TSteps
    initial: TStepKeys
  }
  logger: FlowLogger
  getInitialState: () => SimpleFlowState<TStepKeys, TData>
  calculatePath: (data: Partial<TData>) => TStepKeys[]
  getStepSchema: <TStep extends TStepKeys>(step: TStep) => TSteps[TStep]['schema']
}

/**
 * Validates a flow definition at creation time
 */
function validateFlowDefinition<
  TSteps extends Record<string, StepDefinition<Record<string, unknown>, z.ZodType, string>>,
>(
  definition: {
    id: string
    steps: TSteps
    initial: keyof TSteps & string
  },
  logger: FlowLogger
): void {
  type TStepKeys = keyof TSteps & string

  // Validate initial step exists
  if (!(definition.initial in definition.steps)) {
    throw new Error(
      `[formachine] Initial step "${definition.initial}" not found in flow "${definition.id}"`
    )
  }

  // Validate all step transitions reference existing steps
  for (const [stepId, step] of Object.entries(definition.steps)) {
    if (typeof step.next === 'string') {
      if (step.next !== null && !(step.next in definition.steps)) {
        throw new Error(
          `[formachine] Step "${stepId}" references non-existent step "${step.next}" in flow "${definition.id}"`
        )
      }
    }
  }

  // Detect potential infinite loops (steps with no path to completion)
  const visited = new Set<TStepKeys>()
  let current: TStepKeys | null = definition.initial
  let iterations = 0
  const maxIterations = Object.keys(definition.steps).length * 2

  while (current !== null && iterations < maxIterations) {
    if (visited.has(current)) {
      logger.warn('[formachine] Potential circular reference in flow definition', {
        flowId: definition.id,
        step: current,
      })
      break
    }
    visited.add(current)

    const step = definition.steps[current]
    if (!step) break

    if (typeof step.next === 'string') {
      current = step.next as TStepKeys | null
    } else {
      // Can't determine static path with functions
      break
    }

    iterations++
  }
}

export function createFormFlow<
  TSteps extends Record<string, StepDefinition<Record<string, unknown>, z.ZodType, string>>,
>(
  definition: {
    id: string
    steps: TSteps
    initial: keyof TSteps & string
  },
  options: { logger?: FlowLogger } = {}
): FormFlow<keyof TSteps & string, TSteps, { [K in keyof TSteps]: z.infer<TSteps[K]['schema']> }> {
  type TStepKeys = keyof TSteps & string
  type TData = { [K in keyof TSteps]: z.infer<TSteps[K]['schema']> }

  const logger = options.logger || defaultLogger

  // Validate flow definition
  validateFlowDefinition(definition, logger)

  return {
    definition: definition as { id: string; steps: TSteps; initial: TStepKeys },
    logger,

    getInitialState(): SimpleFlowState<TStepKeys, TData> {
      const initialStep = definition.initial
      return {
        currentStep: initialStep,
        data: {},
        completedSteps: new Set<TStepKeys>(),
        path: [initialStep],
        history: [initialStep],
        status: 'idle',
      }
    },

    calculatePath(data: Partial<TData>): TStepKeys[] {
      const anyFlow = definition as unknown as FlowDefinition<Record<string, AnyStepDefinition>>
      const result = calculatePath(anyFlow, data as Record<string, unknown>, logger)
      return result as TStepKeys[]
    },

    getStepSchema<TStep extends TStepKeys>(step: TStep): TSteps[TStep]['schema'] {
      const stepDef = definition.steps[step]
      if (!stepDef) {
        throw new Error(`Step "${step}" not found in flow "${definition.id}"`)
      }
      return stepDef.schema
    },
  }
}

// Type helper for defining step transitions
export function defineTransition<
  TData extends Record<string, unknown>,
  TStepData,
  TSteps extends string,
>(transition: Transition<TData, TStepData, TSteps>): Transition<TData, TStepData, TSteps> {
  return transition
}
