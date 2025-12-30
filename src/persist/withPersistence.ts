import type { AnyStepDefinition, FormFlow, SimpleFlowState } from '../core'
import type { PersistenceAdapter } from './adapters/types'
import { isExpired } from './ttl'
import type { MigrateFn } from './versioning'

export interface PersistenceOptions<
  TStepKeys extends string,
  TData extends Record<TStepKeys, unknown>,
> {
  adapter: PersistenceAdapter
  key: string
  ttl?: number
  version?: number
  migrate?: MigrateFn<Partial<TData>>
}

// A more permissive state type for persist that accepts wider string types
export interface PersistableFlowState<TData extends Record<string, unknown>> {
  currentStep: string
  data: Partial<TData>
  completedSteps: Set<string>
  path: string[]
  history: string[]
  status: 'idle' | 'validating' | 'submitting' | 'complete' | 'error'
}

export interface PersistedFormFlow<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
  TData extends Record<TStepKeys, unknown>,
> extends FormFlow<TStepKeys, TSteps, TData> {
  hydrate: () => Promise<SimpleFlowState<TStepKeys, TData> | null>
  persist: (state: PersistableFlowState<TData>) => Promise<void>
  clear: () => Promise<void>
}

interface StoredState<T> {
  version: number
  timestamp: number
  data: T
}

export function withPersistence<
  TStepKeys extends string,
  TSteps extends Record<TStepKeys, AnyStepDefinition>,
  TData extends Record<TStepKeys, unknown>,
>(
  flow: FormFlow<TStepKeys, TSteps, TData>,
  options: PersistenceOptions<TStepKeys, TData>
): PersistedFormFlow<TStepKeys, TSteps, TData> {
  const { adapter, key, ttl = 0, version = 1, migrate } = options

  const persist = async (state: PersistableFlowState<TData>): Promise<void> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return
    }

    const stored: StoredState<Partial<TData>> = {
      version,
      timestamp: Date.now(),
      data: state.data,
    }
    await adapter.setItem(key, JSON.stringify(stored))
  }

  const hydrate = async (): Promise<SimpleFlowState<TStepKeys, TData> | null> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return null
    }

    const raw = await adapter.getItem(key)

    if (!raw) {
      return null
    }

    try {
      const stored: StoredState<Partial<TData>> = JSON.parse(raw)

      // Check TTL
      if (ttl > 0 && isExpired(stored.timestamp, ttl)) {
        await adapter.removeItem(key)
        return null
      }

      // Handle versioning
      let data: Partial<TData> | null = null

      if (stored.version === version) {
        data = stored.data
      } else if (migrate) {
        data = migrate(stored.data, stored.version)
      } else {
        // Version mismatch, clear stored data
        await adapter.removeItem(key)
        return null
      }

      if (!data) {
        return null
      }

      // Reconstruct state
      const path = flow.calculatePath(data)
      const completedSteps = new Set(
        (Object.keys(data) as TStepKeys[]).filter((k) => data[k] !== undefined)
      )

      const lastPathStep = path[path.length - 1]
      const currentStep = lastPathStep ?? flow.definition.initial

      return {
        currentStep,
        data,
        completedSteps,
        path,
        history: path,
        status: 'idle',
      }
    } catch {
      // Invalid JSON, clear stored data
      await adapter.removeItem(key)
      return null
    }
  }

  const clear = async (): Promise<void> => {
    // SSR safety check
    if (typeof window === 'undefined') {
      return
    }

    await adapter.removeItem(key)
  }

  return {
    ...flow,
    hydrate,
    persist,
    clear,
  }
}
