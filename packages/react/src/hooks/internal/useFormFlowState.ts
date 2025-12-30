'use client'

import type {
  AnyStepDefinition,
  FlowDefinition,
  FlowState,
  FormFlow,
  InferFlowData,
  InferStepIds,
  PartialFlowData,
} from '@formachine/core'
import type { Dispatch, SetStateAction } from 'react'
import { useState } from 'react'

export interface UseFormFlowStateResult<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  state: FlowState<TFlow>
  setState: Dispatch<SetStateAction<FlowState<TFlow>>>
}

export function useFormFlowState<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  formFlow: FormFlow<InferStepIds<TFlow>, TFlow['steps'], InferFlowData<TFlow>>,
  initialData?: PartialFlowData<TFlow>
): UseFormFlowStateResult<TFlow> {
  const [state, setState] = useState<FlowState<TFlow>>(() => {
    const initial = formFlow.getInitialState() as FlowState<TFlow>
    if (initialData) {
      return {
        ...initial,
        data: initialData,
        path: formFlow.calculatePath(initialData),
      }
    }
    return initial
  })

  return { state, setState }
}
