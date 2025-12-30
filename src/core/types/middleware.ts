import type { AnyStepDefinition, FlowDefinition } from './flow'
import type { InferFlowData, InferStepIds, PartialFlowData } from './schema'

/**
 * Middleware hook that can intercept flow events
 */
export interface FlowMiddleware<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>> {
  /**
   * Called when entering a step
   */
  onStepEnter?: (step: InferStepIds<TFlow>, data: PartialFlowData<TFlow>) => void

  /**
   * Called when exiting a step (after validation)
   */
  onStepExit?: (step: InferStepIds<TFlow>, data: PartialFlowData<TFlow>) => void

  /**
   * Called when the flow is completed
   */
  onComplete?: (data: InferFlowData<TFlow>) => void

  /**
   * Called when an error occurs
   */
  onError?: (error: Error, step: InferStepIds<TFlow>) => void

  /**
   * Called when navigation occurs
   */
  onNavigate?: (from: InferStepIds<TFlow>, to: InferStepIds<TFlow>) => void
}

/**
 * Compose multiple middleware into a single middleware
 */
export function composeMiddleware<TFlow extends FlowDefinition<Record<string, AnyStepDefinition>>>(
  middleware: FlowMiddleware<TFlow>[]
): FlowMiddleware<TFlow> {
  return {
    onStepEnter: (step, data) => {
      for (const mw of middleware) {
        mw.onStepEnter?.(step, data)
      }
    },
    onStepExit: (step, data) => {
      for (const mw of middleware) {
        mw.onStepExit?.(step, data)
      }
    },
    onComplete: (data) => {
      for (const mw of middleware) {
        mw.onComplete?.(data)
      }
    },
    onError: (error, step) => {
      for (const mw of middleware) {
        mw.onError?.(error, step)
      }
    },
    onNavigate: (from, to) => {
      for (const mw of middleware) {
        mw.onNavigate?.(from, to)
      }
    },
  }
}
