'use client'

import type { AnyStepDefinition, FlowDefinition } from '@formachine/core'
import type * as React from 'react'
import { FormFlowContext, type FormFlowContextValue } from '../context'

export interface FormFlowProviderProps<
  TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>,
> {
  value: FormFlowContextValue<TFlow>
  children: React.ReactNode
}

export function FormFlowProvider<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>({
  value,
  children,
}: FormFlowProviderProps<TFlow>): React.ReactElement {
  return (
    <FormFlowContext.Provider
      value={
        value as unknown as FormFlowContextValue<FlowDefinition<Record<string, AnyStepDefinition>>>
      }
    >
      {children}
    </FormFlowContext.Provider>
  )
}
