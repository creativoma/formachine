import type { AnyStepDefinition, FlowDefinition } from './flow'
import type { InferStepIds, PartialFlowData } from './schema'

export type FlowStatus = 'idle' | 'validating' | 'submitting' | 'complete' | 'error'

export interface FlowState<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  currentStep: InferStepIds<TFlow>
  data: PartialFlowData<TFlow>
  completedSteps: Set<InferStepIds<TFlow>>
  path: InferStepIds<TFlow>[]
  history: InferStepIds<TFlow>[]
  status: FlowStatus
}
