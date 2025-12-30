'use client'

import { getNextStep } from '../../core'
import { useMemo } from 'react'
import { useFormFlowContext } from '../context'

export interface PreloadInfo {
  nextStepId: string | null
  shouldPreload: boolean
  preloadComponent: boolean
}

export interface UsePreloadNextOptions {
  enabled?: boolean
  preloadOnIdle?: boolean
}

/**
 * Hook to preload the next step in the flow.
 * Useful for improving perceived performance by rendering the next step off-screen.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { nextStepId, shouldPreload } = usePreloadNext({ enabled: true })
 *
 *   return (
 *     <>
 *       <Step name="current">...</Step>
 *       {shouldPreload && nextStepId && (
 *         <div style={{ display: 'none' }}>
 *           <Step name={nextStepId}>...</Step>
 *         </div>
 *       )}
 *     </>
 *   )
 * }
 * ```
 */
export function usePreloadNext(options: UsePreloadNextOptions = {}): PreloadInfo {
  const { enabled = false, preloadOnIdle = true } = options
  const { state, path } = useFormFlowContext()

  const preloadInfo = useMemo<PreloadInfo>(() => {
    if (!enabled) {
      return {
        nextStepId: null,
        shouldPreload: false,
        preloadComponent: false,
      }
    }

    const nextStepId = getNextStep(state.currentStep, path)

    if (nextStepId === null) {
      // No next step (end of flow)
      return {
        nextStepId: null,
        shouldPreload: false,
        preloadComponent: false,
      }
    }

    // Only preload if we're not currently validating/submitting
    const isIdle = state.status === 'idle'
    const shouldPreload = preloadOnIdle ? isIdle : true

    return {
      nextStepId: String(nextStepId),
      shouldPreload,
      preloadComponent: shouldPreload,
    }
  }, [enabled, preloadOnIdle, state.currentStep, state.status, path])

  return preloadInfo
}
