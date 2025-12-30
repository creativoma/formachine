# @formachine/persist

> State persistence adapters for formachine

Persistence layer for formachine that enables saving and restoring form flow state across sessions, with built-in TTL support and versioning.

## Installation

```bash
npm install @formachine/persist @formachine/core
# or
pnpm add @formachine/persist @formachine/core
# or
yarn add @formachine/persist @formachine/core
```

## Features

- 💾 **Multiple storage adapters** - localStorage, sessionStorage, custom
- ⏰ **TTL support** - Auto-expire persisted data
- 🔄 **Versioning** - Handle schema migrations gracefully
- 🎯 **Selective persistence** - Choose what to save
- 🔒 **Type-safe** - Full TypeScript support

## Quick Start

### Basic Usage

```typescript
import { createFormFlow } from '@formachine/core'
import { withPersistence } from '@formachine/persist'
import { localStorageAdapter } from '@formachine/persist/adapters'

const myFlow = createFormFlow({
  id: 'signup',
  initial: 'account',
  steps: {
    account: { schema: accountSchema, next: 'profile' },
    profile: { schema: profileSchema, next: null },
  },
})

// Wrap your flow with persistence
const persistedFlow = withPersistence(myFlow, {
  adapter: localStorageAdapter,
  key: 'signup-flow',
})
```

### With React

```tsx
import { useFormFlow } from '@formachine/react'
import { withPersistence } from '@formachine/persist'
import { localStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(checkoutFlow, {
  adapter: localStorageAdapter,
  key: 'checkout',
})

function CheckoutForm() {
  const flow = useFormFlow(persistedFlow, {
    onComplete: (data) => {
      // Data is automatically cleared on complete
      submitOrder(data)
    },
  })

  return (
    // Form UI...
  )
}
```

## API Reference

### `withPersistence(flow, options)`

Wraps a flow with persistence capabilities.

```typescript
const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'my-flow',
  ttl: 24 * 60 * 60 * 1000,  // 24 hours in ms
  version: 1,
  migrate: (data, oldVersion) => data,
  debounce: 300,              // Debounce saves (ms)
  saveOn: ['stepChange', 'dataChange', 'complete'],
  clearOnComplete: true,
})
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | `StorageAdapter` | Required | Storage adapter to use |
| `key` | `string` | Required | Storage key for this flow |
| `ttl` | `number` | `undefined` | Time-to-live in milliseconds |
| `version` | `number` | `1` | Schema version for migrations |
| `migrate` | `Function` | `undefined` | Migration function |
| `debounce` | `number` | `0` | Debounce save operations |
| `saveOn` | `SaveTrigger[]` | `['stepChange', 'dataChange']` | When to trigger saves |
| `clearOnComplete` | `boolean` | `true` | Clear storage on flow complete |

### Storage Adapters

#### `localStorageAdapter`

Persists data to `localStorage`. Data survives browser sessions.

```typescript
import { localStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'my-flow',
})
```

#### `sessionStorageAdapter`

Persists data to `sessionStorage`. Data is cleared when the tab closes.

```typescript
import { sessionStorageAdapter } from '@formachine/persist/adapters'

const persistedFlow = withPersistence(flow, {
  adapter: sessionStorageAdapter,
  key: 'my-flow',
})
```

#### Custom Adapters

Create custom adapters for any storage backend.

```typescript
import type { StorageAdapter } from '@formachine/persist/adapters'

const customAdapter: StorageAdapter = {
  async get(key: string) {
    const data = await myDatabase.get(key)
    return data ? JSON.parse(data) : null
  },
  
  async set(key: string, value: unknown) {
    await myDatabase.set(key, JSON.stringify(value))
  },
  
  async remove(key: string) {
    await myDatabase.delete(key)
  },
}

const persistedFlow = withPersistence(flow, {
  adapter: customAdapter,
  key: 'my-flow',
})
```

## TTL (Time-To-Live)

Automatically expire persisted data after a specified duration.

```typescript
const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'checkout',
  ttl: 30 * 60 * 1000, // 30 minutes
})
```

When the TTL expires:
- `get()` returns `null`
- Data is automatically cleaned up on next access

### TTL Utilities

```typescript
import { isExpired, setWithTTL, getWithTTL } from '@formachine/persist'

// Check if data has expired
const expired = isExpired(timestamp, ttl)

// Low-level TTL operations
await setWithTTL(adapter, key, data, ttl)
const data = await getWithTTL(adapter, key)
```

## Versioning & Migrations

Handle schema changes gracefully with versioning.

```typescript
const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'signup',
  version: 2, // Current version
  
  migrate: (data, oldVersion) => {
    // Migrate from v1 to v2
    if (oldVersion === 1) {
      return {
        ...data,
        account: {
          ...data.account,
          // Split name into firstName/lastName
          firstName: data.account.name?.split(' ')[0] || '',
          lastName: data.account.name?.split(' ').slice(1).join(' ') || '',
        },
      }
    }
    return data
  },
})
```

### Migration Utilities

```typescript
import { createVersionedPersistence, migrateData } from '@formachine/persist'

// Helper for complex migrations
const migrations = {
  1: (data) => ({ ...data, /* v1 -> v2 */ }),
  2: (data) => ({ ...data, /* v2 -> v3 */ }),
}

const migrated = migrateData(data, fromVersion, toVersion, migrations)
```

## Advanced Usage

### Debounced Saves

Prevent excessive writes by debouncing save operations.

```typescript
const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'form',
  debounce: 500, // Wait 500ms after last change
})
```

### Selective Persistence

Control when data is saved.

```typescript
const persistedFlow = withPersistence(flow, {
  adapter: localStorageAdapter,
  key: 'checkout',
  saveOn: ['stepChange'], // Only save when step changes
})
```

Available triggers:
- `'stepChange'` - Save when navigating between steps
- `'dataChange'` - Save when form data changes
- `'complete'` - Save on flow completion

### Manual Control

Access persistence methods directly.

```typescript
// Clear persisted data
await persistedFlow.clearPersisted()

// Force save
await persistedFlow.forceSave()

// Get persisted data without loading into flow
const data = await persistedFlow.getPersistedData()
```

### Server-Side Persistence

Create an adapter for server-side storage:

```typescript
const apiAdapter: StorageAdapter = {
  async get(key) {
    const response = await fetch(`/api/drafts/${key}`)
    if (!response.ok) return null
    return response.json()
  },
  
  async set(key, value) {
    await fetch(`/api/drafts/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    })
  },
  
  async remove(key) {
    await fetch(`/api/drafts/${key}`, { method: 'DELETE' })
  },
}
```

### Encrypted Storage

Wrap an adapter with encryption:

```typescript
import { createCustomAdapter } from '@formachine/persist/adapters'

const encryptedAdapter = createCustomAdapter({
  async get(key) {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    return JSON.parse(decrypt(encrypted))
  },
  
  async set(key, value) {
    const encrypted = encrypt(JSON.stringify(value))
    localStorage.setItem(key, encrypted)
  },
  
  async remove(key) {
    localStorage.removeItem(key)
  },
})
```

## TypeScript

Full type safety with persisted flows:

```typescript
import type { PersistedFlow, StorageAdapter } from '@formachine/persist'

// Types are inferred from the original flow
const persistedFlow: PersistedFlow<typeof myFlow> = withPersistence(
  myFlow,
  { adapter: localStorageAdapter, key: 'my-flow' }
)
```

## Storage Formats

### Persisted Data Structure

```typescript
interface PersistedData<T> {
  version: number
  timestamp: number
  data: {
    currentStep: string
    completedSteps: string[]
    formData: T
  }
}
```

## License

MIT
