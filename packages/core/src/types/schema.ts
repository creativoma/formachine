import type { z } from 'zod'
import type { AnyStepDefinition, FlowDefinition } from './flow'

export type InferFlowData<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> = {
  [K in keyof TFlow['steps']]: z.infer<TFlow['steps'][K]['schema']>
}

export type InferStepIds<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> =
  keyof TFlow['steps'] & string

export type PartialFlowData<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> = {
  [K in keyof TFlow['steps']]?: z.infer<TFlow['steps'][K]['schema']>
}

export type InferStepData<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
  TStep extends keyof TFlow['steps'],
> = z.infer<TFlow['steps'][TStep]['schema']>
