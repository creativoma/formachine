'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FormFlow,
  InferFlowData,
  InferStepIds,
} from '../../../core'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'

export function useFormFlowForm<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  currentStep: InferStepIds<TFlow>,
  stepData: unknown
): UseFormReturn<FieldValues, unknown, unknown> {
  const currentSchema = formFlow.getStepSchema(currentStep)

  const form = useForm({
    resolver: zodResolver(currentSchema as unknown as Parameters<typeof zodResolver>[0]),
    defaultValues: (stepData ?? {}) as Record<string, unknown>,
    mode: 'onBlur',
  })

  return form
}
