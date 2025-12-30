# @formachine/persist API Reference

Complete API documentation for the persistence package.

## Table of Contents

- [withPersistence](#withpersistence)
- [Storage Adapters](#storage-adapters)
  - [localStorageAdapter](#localstorageadapter)
  - [sessionStorageAdapter](#sessionstorageadapter)
  - [createCustomAdapter](#createcustomadapter)
- [TTL Functions](#ttl-functions)
- [Versioning Functions](#versioning-functions)
- [Types](#types)

---

## withPersistence

Wraps a form flow with persistence capabilities.

### Signature

```typescript
function withPersistence<T extends FlowDefinition>(
  flow: FormFlow<T>,
  options: PersistenceOptions
): PersistedFlow<T>
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | `StorageAdapter` | Required | Storage adapter to use |
| `key` | `string` | Required | Storage key for this flow |
| `ttl` | `number` | `undefined` | Time-to-live in milliseconds |
| `version` | `number` | `1` | Schema version for migrations |
| `migrate` | `MigrateFn` | `undefined` | Migration function |
| `debounce` | `number` | `0` | Debounce save operations (ms) |
| `saveOn` | `SaveTrigger[]` | `['stepChange', 'dataChange']` | When to trigger saves |
| `clearOnComplete` | `boolean` | `true` | Clear storage on flow complete |

### Returns

A `PersistedFlow` instance extending the original flow with:

| Property | Type | Description |
|----------|------|-------------|
| `persist(state)` | `(state: FlowState) => Promise<void>` | Save state to storage |
| `hydrate()` | `() => Promise<FlowState \| null>` | Load state from storage |
| `clearPersisted()` | `() => Promise<void>` | Clear persisted data |
| `forceSave()` | `() => Promise<void>` | Force immediate save |
| `getPersistedData()` | `() => Promise<PersistedData \| null>` | Get raw persisted data |

### Example

```typescript
import { withPersistence } from '@formachine/persist'
import { localStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(myFlow, {
  adapter: localStorageAdapter,
  key: 'my-form',
  ttl: 60 * 60 * 1000, // 1 hour
  version: 2,
  migrate: (data, oldVersion) => {
    if (oldVersion === 1) {
      return migrateV1toV2(data)
    }
    return data
  },
  debounce: 300,
  saveOn: ['stepChange', 'dataChange'],
  clearOnComplete: true,
})
```

---

## Storage Adapters

### localStorageAdapter

Built-in adapter for browser `localStorage`.

```typescript
import { localStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'my-flow',
})
```

**Characteristics:**
- Data persists across browser sessions
- ~5MB storage limit per domain
- Synchronous operations (wrapped in promises)
- Not available during SSR

---

### sessionStorageAdapter

Built-in adapter for browser `sessionStorage`.

```typescript
import { sessionStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(flow, {
  adapter: sessionStorageAdapter,
  key: 'my-flow',
})
```

**Characteristics:**
- Data cleared when tab/window closes
- ~5MB storage limit per domain
- Separate per tab/window
- Not available during SSR

---

### createCustomAdapter

Factory function for creating custom storage adapters.

#### Signature

```typescript
function createCustomAdapter(config: AdapterConfig): StorageAdapter
```

#### AdapterConfig

```typescript
interface AdapterConfig {
  get: (key: string) => Promise<unknown | null>
  set: (key: string, value: unknown) => Promise<void>
  remove: (key: string) => Promise<void>
}
```

#### Example

```typescript
import { createCustomAdapter } from '@formachine/persist/adapters'

// IndexedDB adapter
const idbAdapter = createCustomAdapter({
  async get(key) {
    const db = await openDB()
    return db.get('store', key)
  },
  async set(key, value) {
    const db = await openDB()
    await db.put('store', value, key)
  },
  async remove(key) {
    const db = await openDB()
    await db.delete('store', key)
  },
})

// API adapter
const apiAdapter = createCustomAdapter({
  async get(key) {
    const res = await fetch(`/api/drafts/${key}`)
    if (!res.ok) return null
    return res.json()
  },
  async set(key, value) {
    await fetch(`/api/drafts/${key}`, {
      method: 'PUT',
      body: JSON.stringify(value),
    })
  },
  async remove(key) {
    await fetch(`/api/drafts/${key}`, { method: 'DELETE' })
  },
})
```

---

## TTL Functions

### setWithTTL

Saves data with a TTL timestamp.

```typescript
async function setWithTTL(
  adapter: StorageAdapter,
  key: string,
  data: unknown,
  ttl: number
): Promise<void>
```

### getWithTTL

Retrieves data, returning `null` if expired.

```typescript
async function getWithTTL(
  adapter: StorageAdapter,
  key: string
): Promise<unknown | null>
```

### isExpired

Checks if a timestamp has exceeded TTL.

```typescript
function isExpired(timestamp: number, ttl: number): boolean
```

### Example

```typescript
import { setWithTTL, getWithTTL, isExpired } from '@formachine/persist'

// Save with 1 hour TTL
await setWithTTL(adapter, 'my-key', myData, 60 * 60 * 1000)

// Get data (returns null if expired)
const data = await getWithTTL(adapter, 'my-key')

// Manual check
if (isExpired(savedTimestamp, ttl)) {
  console.log('Data has expired')
}
```

---

## Versioning Functions

### migrateData

Applies a series of migrations to data.

```typescript
function migrateData(
  data: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: Record<number, MigrateFn>
): unknown
```

### Example

```typescript
import { migrateData } from '@formachine/persist'

const migrations = {
  1: (data) => ({
    ...data,
    // Migrate v1 -> v2: split name field
    account: {
      ...data.account,
      firstName: data.account.name?.split(' ')[0] || '',
      lastName: data.account.name?.split(' ').slice(1).join(' ') || '',
    },
  }),
  2: (data) => ({
    ...data,
    // Migrate v2 -> v3: add new required field
    profile: {
      ...data.profile,
      timezone: data.profile.timezone || 'UTC',
    },
  }),
}

const migrated = migrateData(oldData, 1, 3, migrations)
```

---

## Types

### StorageAdapter

```typescript
interface StorageAdapter {
  /** Retrieve data by key */
  get(key: string): Promise<unknown | null>
  
  /** Save data with key */
  set(key: string, value: unknown): Promise<void>
  
  /** Remove data by key */
  remove(key: string): Promise<void>
}
```

### PersistenceOptions

```typescript
interface PersistenceOptions {
  /** Storage adapter to use */
  adapter: StorageAdapter
  
  /** Storage key for this flow */
  key: string
  
  /** Time-to-live in milliseconds */
  ttl?: number
  
  /** Schema version for migrations */
  version?: number
  
  /** Migration function */
  migrate?: MigrateFn
  
  /** Debounce save operations (ms) */
  debounce?: number
  
  /** When to trigger saves */
  saveOn?: SaveTrigger[]
  
  /** Clear storage on flow complete */
  clearOnComplete?: boolean
}
```

### SaveTrigger

```typescript
type SaveTrigger = 'stepChange' | 'dataChange' | 'complete'
```

### MigrateFn

```typescript
type MigrateFn = (data: unknown, oldVersion: number) => unknown
```

### PersistedData

```typescript
interface PersistedData<T = unknown> {
  /** Schema version */
  version: number
  
  /** Save timestamp */
  timestamp: number
  
  /** Flow state data */
  data: {
    currentStep: string
    completedSteps: string[]
    formData: T
  }
}
```

### PersistedFlow

```typescript
interface PersistedFlow<T extends FlowDefinition> extends FormFlow<T> {
  /** Save current state to storage */
  persist(state: FlowState<T>): Promise<void>
  
  /** Load state from storage */
  hydrate(): Promise<FlowState<T> | null>
  
  /** Clear persisted data */
  clearPersisted(): Promise<void>
  
  /** Force immediate save (bypasses debounce) */
  forceSave(): Promise<void>
  
  /** Get raw persisted data without hydrating */
  getPersistedData(): Promise<PersistedData | null>
}
```
