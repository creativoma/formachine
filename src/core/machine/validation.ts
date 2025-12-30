import type { AnyStepDefinition } from '../types'

/**
 * Interface for flow validation (without id requirement)
 */
export interface FormFlowDefinition<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
> {
  initial: TStepKeys
  steps: TSteps
}

export interface FlowValidationError {
  type:
    | 'missing_step'
    | 'invalid_next'
    | 'infinite_loop'
    | 'deadlock'
    | 'missing_schema'
    | 'unreachable_step'
  message: string
  step?: string
  path?: string[]
  details?: Record<string, unknown>
}

/**
 * Validates a flow definition for common issues
 * Returns array of validation errors (empty if valid)
 */
export function validateFlowDefinition<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
>(definition: FormFlowDefinition<TStepKeys, TSteps>): FlowValidationError[] {
  const errors: FlowValidationError[] = []
  const stepKeys = Object.keys(definition.steps) as TStepKeys[]

  // 1. Validate that initial step exists
  if (!stepKeys.includes(definition.initial)) {
    errors.push({
      type: 'missing_step',
      message: `Initial step "${String(definition.initial)}" not found in steps definition`,
      step: String(definition.initial),
      details: { availableSteps: stepKeys },
    })
  }

  // 2. Validate that all static next steps exist
  for (const [stepKey, step] of Object.entries(definition.steps) as Array<
    [TStepKeys, AnyStepDefinition]
  >) {
    if (typeof step.next === 'string') {
      if (!stepKeys.includes(step.next as TStepKeys)) {
        errors.push({
          type: 'invalid_next',
          message: `Step "${String(stepKey)}" references non-existent next step "${step.next}"`,
          step: String(stepKey),
          details: { invalidNext: step.next, availableSteps: stepKeys },
        })
      }
    }
  }

  // 3. Detect simple infinite loops (direct cycles)
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  const detectCycle = (current: string, path: string[]): boolean => {
    if (recursionStack.has(current)) {
      // Cycle detected
      const cycleStart = path.indexOf(current)
      const cyclePath = [...path.slice(cycleStart), current]

      errors.push({
        type: 'infinite_loop',
        message: `Infinite loop detected: ${cyclePath.join(' → ')}`,
        path: cyclePath,
      })
      return true
    }

    if (visited.has(current)) {
      return false
    }

    visited.add(current)
    recursionStack.add(current)

    const step = definition.steps[current as TStepKeys]
    if (step && typeof step.next === 'string') {
      detectCycle(step.next, [...path, current])
    }

    recursionStack.delete(current)
    return false
  }

  // Start cycle detection from initial step
  if (stepKeys.includes(definition.initial)) {
    detectCycle(String(definition.initial), [])
  }

  // 4. Validate that all steps have schemas
  for (const [stepKey, step] of Object.entries(definition.steps) as Array<
    [TStepKeys, AnyStepDefinition]
  >) {
    if (!step.schema) {
      errors.push({
        type: 'missing_schema',
        message: `Step "${String(stepKey)}" is missing a schema definition`,
        step: String(stepKey),
      })
    }
  }

  // 5. Detect unreachable steps (steps that can never be reached from initial)
  const reachableSteps = new Set<string>()
  const queue: string[] = [String(definition.initial)]
  const processedForReachability = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    if (processedForReachability.has(current)) {
      continue
    }

    processedForReachability.add(current)
    reachableSteps.add(current)

    const step = definition.steps[current as TStepKeys]
    if (step && typeof step.next === 'string') {
      queue.push(step.next)
    }
  }

  for (const stepKey of stepKeys) {
    const stepStr = String(stepKey)
    if (!reachableSteps.has(stepStr) && stepStr !== String(definition.initial)) {
      errors.push({
        type: 'unreachable_step',
        message: `Step "${stepStr}" is unreachable from initial step "${String(definition.initial)}"`,
        step: stepStr,
        details: { reachableSteps: Array.from(reachableSteps) },
      })
    }
  }

  return errors
}

/**
 * Asserts that a flow definition is valid, throwing if errors are found
 * @throws Error if validation fails
 */
export function assertValidFlow<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
>(definition: FormFlowDefinition<TStepKeys, TSteps>): void {
  const errors = validateFlowDefinition(definition)

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => {
        let msg = `  - [${e.type}] ${e.message}`
        if (e.details) {
          msg += `\n    Details: ${JSON.stringify(e.details)}`
        }
        return msg
      })
      .join('\n')

    throw new Error(
      `Flow definition validation failed (${errors.length} error${errors.length > 1 ? 's' : ''}):\n${errorMessages}`
    )
  }
}

/**
 * Returns warnings for potential issues that aren't critical errors
 */
export function getFlowWarnings<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
>(definition: FormFlowDefinition<TStepKeys, TSteps>): string[] {
  const warnings: string[] = []
  const stepKeys = Object.keys(definition.steps) as TStepKeys[]

  // Warn about steps with no next (potential dead ends)
  for (const [stepKey, step] of Object.entries(definition.steps) as Array<
    [TStepKeys, AnyStepDefinition]
  >) {
    if (step.next === null || step.next === undefined) {
      warnings.push(`Step "${String(stepKey)}" has no next step defined. This is a terminal step.`)
    }
  }

  // Warn about dynamic next steps (harder to validate statically)
  for (const [stepKey, step] of Object.entries(definition.steps) as Array<
    [TStepKeys, AnyStepDefinition]
  >) {
    if (typeof step.next === 'function') {
      warnings.push(
        `Step "${String(stepKey)}" uses a dynamic next function. Ensure all possible return values are valid step names.`
      )
    }
  }

  // Warn if flow has only one step
  if (stepKeys.length === 1) {
    warnings.push('Flow has only one step. Consider if this is intentional.')
  }

  return warnings
}
