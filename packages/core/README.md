# @formachine/core

> Core flow definition, state machine, and types for formachine

The foundational package that provides the type-safe flow definitions, state machine logic, and path calculation for multi-step form flows.

## Installation

```bash
npm install @formachine/core
# or
pnpm add @formachine/core
# or
yarn add @formachine/core
```

## Features

- 🔷 **Type-safe flow definitions** - Full TypeScript support with inferred types
- 🔀 **Branching logic** - Define dynamic paths based on user input
- ✅ **Zod validation** - First-class schema validation with Zod
- 🛤️ **Path calculation** - Automatic path computation based on data
- 🎯 **Framework agnostic** - Use with any UI framework

## Quick Start

### Define a Flow

```typescript
import { createFormFlow } from '@formachine/core'
import { z } from 'zod'

const onboardingFlow = createFormFlow({
  id: 'onboarding',
  initial: 'welcome',
  steps: {
    welcome: {
      schema: z.object({
        acceptTerms: z.boolean().refine(v => v === true, 'Must accept terms'),
      }),
      next: 'personal',
    },
    personal: {
      schema: z.object({
        name: z.string().min(2),
        email: z.string().email(),
      }),
      next: 'preferences',
    },
    preferences: {
      schema: z.object({
        theme: z.enum(['light', 'dark', 'system']),
        notifications: z.boolean(),
      }),
      next: null, // End of flow
    },
  },
})
```

### Branching Flows

```typescript
import { createFormFlow } from '@formachine/core'
import { z } from 'zod'

const checkoutFlow = createFormFlow({
  id: 'checkout',
  initial: 'cart',
  steps: {
    cart: {
      schema: z.object({
        items: z.array(z.object({
          id: z.string(),
          quantity: z.number().min(1),
        })),
      }),
      // Dynamic next step based on data
      next: (data) => data.items.length > 0 ? 'shipping' : 'empty',
    },
    empty: {
      schema: z.object({}),
      next: null,
    },
    shipping: {
      schema: z.object({
        address: z.string(),
        city: z.string(),
        country: z.string(),
      }),
      next: 'payment',
    },
    payment: {
      schema: z.object({
        cardNumber: z.string(),
        expiry: z.string(),
        cvv: z.string(),
      }),
      next: null,
    },
  },
})
```

## API Reference

### `createFormFlow(definition)`

Creates a new form flow instance.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `definition.id` | `string` | Unique identifier for the flow |
| `definition.initial` | `string` | The starting step ID |
| `definition.steps` | `Record<string, StepDefinition>` | Step definitions |

#### Returns

Returns a `FormFlow` instance with the following methods:

- `getInitialState()` - Get the initial state of the flow
- `getStepSchema(stepId)` - Get the Zod schema for a step
- `calculatePath(data)` - Calculate the reachable path based on current data
- `definition` - Access the raw flow definition

### `StepDefinition`

```typescript
interface StepDefinition<TSchema extends z.ZodType> {
  schema: TSchema                           // Zod schema for validation
  next: string | null | TransitionFn        // Next step or transition function
}

type TransitionFn<TData> = (
  stepData: TData,
  allData: PartialFlowData
) => string | null
```

### Path Functions

#### `calculatePath(flow, data)`

Calculates the reachable path from the initial step.

```typescript
import { calculatePath } from '@formachine/core'

const path = calculatePath(flow.definition, {
  welcome: { acceptTerms: true },
  personal: { name: 'John', email: 'john@example.com' },
})
// ['welcome', 'personal', 'preferences']
```

#### `getNextStep(currentStep, path)`

Get the next step in the path.

```typescript
import { getNextStep } from '@formachine/core'

const next = getNextStep('personal', ['welcome', 'personal', 'preferences'])
// 'preferences'
```

#### `getPreviousStep(currentStep, path)`

Get the previous step in the path.

```typescript
import { getPreviousStep } from '@formachine/core'

const prev = getPreviousStep('preferences', ['welcome', 'personal', 'preferences'])
// 'personal'
```

#### `canNavigateToStep(flow, targetStep, completedSteps, path)`

Check if navigation to a step is allowed.

```typescript
import { canNavigateToStep } from '@formachine/core'

const canGo = canNavigateToStep(
  flow.definition,
  'preferences',
  new Set(['welcome', 'personal']),
  ['welcome', 'personal', 'preferences']
)
// true
```

### Validation Functions

#### `validateStep(schema, data)`

Validates step data against its schema.

```typescript
import { validateStep } from '@formachine/core'

const result = await validateStep(
  z.object({ name: z.string().min(2) }),
  { name: 'John' }
)

if (result.success) {
  console.log(result.data) // Typed data
} else {
  console.log(result.errors) // Validation errors
}
```

#### `validateStepSync(schema, data)`

Synchronous version of `validateStep`.

## Types

### `FlowDefinition`

```typescript
interface FlowDefinition<TSteps extends Record<string, AnyStepDefinition>> {
  id: string
  initial: keyof TSteps
  steps: TSteps
}
```

### `FlowState`

```typescript
interface FlowState<TFlow extends FlowDefinition> {
  currentStep: InferStepIds<TFlow>
  data: PartialFlowData<TFlow>
  path: InferStepIds<TFlow>[]
  completedSteps: Set<InferStepIds<TFlow>>
  history: InferStepIds<TFlow>[]
  status: FlowStatus
}

type FlowStatus = 'idle' | 'validating' | 'submitting' | 'error' | 'complete'
```

### Type Inference

```typescript
import type { InferFlowData, InferStepIds, InferStepData } from '@formachine/core'

// Infer all step IDs
type StepIds = InferStepIds<typeof onboardingFlow.definition>
// 'welcome' | 'personal' | 'preferences'

// Infer complete flow data
type FlowData = InferFlowData<typeof onboardingFlow.definition>
// { welcome: {...}, personal: {...}, preferences: {...} }

// Infer specific step data
type PersonalData = InferStepData<typeof onboardingFlow.definition, 'personal'>
// { name: string, email: string }
```

## Advanced Usage

### Async Validation

```typescript
import { createAbortableValidation, withRetry } from '@formachine/core'

// Create an abortable validation
const { validate, abort } = createAbortableValidation(async (data) => {
  const response = await fetch('/api/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
})

// With retry logic
const validateWithRetry = withRetry(validate, {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
})
```

### Validation Caching

```typescript
import { createValidationCache } from '@formachine/core'

const cache = createValidationCache({
  ttl: 60000, // 1 minute
  maxSize: 100,
})

// Check cache before validating
const cached = cache.get('step1', { name: 'John' })
if (!cached) {
  const result = await validateStep(schema, data)
  cache.set('step1', data, result)
}
```

## License

MIT
