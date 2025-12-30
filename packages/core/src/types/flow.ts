import type { z } from 'zod'

export type StepId = string

/**
 * Bivariant function type using method signature syntax.
 *
 * This allows transition functions with more specific parameter types
 * to be assignable to more general types, enabling better DX when
 * defining flows with conditional branching.
 *
 * Without this, TypeScript would enforce strict contravariance on
 * function parameters, making it difficult to type-narrow step data
 * in transition functions while maintaining type safety.
 *
 * @see https://www.typescriptlang.org/docs/handbook/type-compatibility.html#function-parameter-bivariance
 * @internal
 */
type BivariantFn<TStepData, TAllData, TResult> = {
  bivarianceHack(stepData: TStepData, allData: TAllData): TResult
}['bivarianceHack']

export type TransitionFn<
  TData extends Record<string, unknown>,
  TStepData,
  TSteps extends StepId,
> = BivariantFn<TStepData, Partial<TData>, TSteps | null>

export type Transition<TData extends Record<string, unknown>, TStepData, TSteps extends StepId> =
  | TSteps
  | null
  | TransitionFn<TData, TStepData, TSteps>

export type AnyTransition<TSteps extends StepId = string> =
  | TSteps
  | null
  | BivariantFn<unknown, Partial<Record<string, unknown>>, TSteps | null>

export interface StepDefinition<
  TData extends Record<string, unknown>,
  TSchema extends z.ZodType,
  TSteps extends StepId,
> {
  schema: TSchema
  next: Transition<TData, z.infer<TSchema>, TSteps>
}

export interface AnyStepDefinition {
  schema: z.ZodType
  next: AnyTransition<string>
}

export interface FlowDefinition<TSteps extends Record<StepId, AnyStepDefinition>> {
  id: string
  steps: TSteps
  initial: keyof TSteps & string
}

export type AnyFlowDefinition = FlowDefinition<Record<StepId, AnyStepDefinition>>
