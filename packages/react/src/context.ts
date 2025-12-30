import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  FormFlow,
  InferFlowData,
  InferStepIds,
  PartialFlowData,
} from '@formachine/core'
import { createContext, useContext } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

export interface FormFlowContextValue<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  flow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>
  state: FlowState<TFlow>

  // Navigation
  currentStep: InferStepIds<TFlow>
  goTo: (step: InferStepIds<TFlow>) => void
  next: () => Promise<boolean>
  back: () => void
  reset: (data?: PartialFlowData<TFlow>) => void
  canGoTo: (step: InferStepIds<TFlow>) => boolean
  canGoBack: boolean
  canGoNext: boolean

  // Data
  getData: <TStep extends InferStepIds<TFlow>>(step: TStep) => PartialFlowData<TFlow>[TStep]
  setData: <TStep extends InferStepIds<TFlow>>(
    step: TStep,
    data: PartialFlowData<TFlow>[TStep]
  ) => void

  // Path
  path: InferStepIds<TFlow>[]
  completedSteps: Set<InferStepIds<TFlow>>

  // Status
  isSubmitting: boolean
  isComplete: boolean

  // Form (current step)
  form: UseFormReturn<FieldValues, unknown, unknown>
}

export const FormFlowContext = createContext<FormFlowContextValue<
  FlowDefinition<Record<string, AnyStepDefinition>>
> | null>(null)

export function useFormFlowContext<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
>(): FormFlowContextValue<TFlow> {
  const context = useContext(FormFlowContext)

  if (!context) {
    throw new Error('useFormFlowContext must be used within a FormFlowProvider')
  }

  return context as unknown as FormFlowContextValue<TFlow>
}
