# @formachine/core API Reference

Complete API documentation for the core package.

## Table of Contents

- [createFormFlow](#createformflow)
- [Types](#types)
  - [FlowDefinition](#flowdefinition)
  - [StepDefinition](#stepdefinition)
  - [FlowState](#flowstate)
- [Path Functions](#path-functions)
- [Validation Functions](#validation-functions)
- [Type Utilities](#type-utilities)

---

## createFormFlow

Creates a new form flow instance from a flow definition.

### Signature

```typescript
function createFormFlow<T extends FlowDefinition>(definition: T): FormFlow<T>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `definition` | `FlowDefinition` | The flow configuration object |

### Returns

A `FormFlow` instance with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `definition` | `T` | The original flow definition |
| `getInitialState()` | `() => FlowState<T>` | Returns the initial state |
| `computePath(state)` | `(state) => string[]` | Computes reachable path |
| `transition(state, action)` | `(state, action) => FlowState<T>` | Applies a state transition |
| `canTransition(state, to)` | `(state, to) => boolean` | Checks if transition is allowed |

### Example

```typescript
import { createFormFlow } from '@formachine/core'
import { z } from 'zod'

const flow = createFormFlow({
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
      next: 'shipping',
    },
    shipping: {
      schema: z.object({
        address: z.string().min(10),
        city: z.string(),
        zip: z.string(),
      }),
      next: 'payment',
    },
    payment: {
      schema: z.object({
        cardNumber: z.string().length(16),
        expiry: z.string(),
        cvv: z.string().length(3),
      }),
      next: null,
    },
  },
})
```

---

## Types

### FlowDefinition

The configuration object for a form flow.

```typescript
interface FlowDefinition {
  /** Unique identifier for the flow */
  id: string
  
  /** The initial step ID */
  initial: string
  
  /** Map of step ID to step definition */
  steps: Record<string, StepDefinition>
}
```

### StepDefinition

Configuration for a single step in the flow.

```typescript
interface StepDefinition {
  /** Zod schema for validating step data */
  schema: ZodSchema
  
  /** 
   * Next step ID, null for final step, or function for dynamic branching
   */
  next: string | null | ((data: StepData) => string | null)
  
  /** Optional async validation function */
  validate?: (data: StepData) => Promise<boolean | ValidationError>
  
  /** Optional metadata */
  meta?: Record<string, unknown>
}
```

#### Dynamic Branching

The `next` property can be a function for conditional paths:

```typescript
const step: StepDefinition = {
  schema: z.object({
    accountType: z.enum(['personal', 'business']),
  }),
  next: (data) => {
    switch (data.accountType) {
      case 'personal': return 'personalInfo'
      case 'business': return 'businessInfo'
      default: return null
    }
  },
}
```

### FlowState

The current state of a form flow.

```typescript
interface FlowState<T extends FlowDefinition> {
  /** Current active step ID */
  currentStep: string
  
  /** Set of completed step IDs */
  completedSteps: Set<string>
  
  /** Data for each step */
  data: InferFlowData<T>
  
  /** Current reachable path */
  path: string[]
  
  /** Error state, if any */
  error?: Error
  
  /** Whether the flow is complete */
  isComplete: boolean
}
```

---

## Path Functions

Functions for computing and working with flow paths.

### computePath

Computes the reachable path from current state.

```typescript
function computePath<T extends FlowDefinition>(
  flow: FormFlow<T>,
  state: FlowState<T>
): string[]
```

### getNextStep

Gets the next step ID based on current data.

```typescript
function getNextStep<T extends FlowDefinition>(
  flow: FormFlow<T>,
  stepId: string,
  data: StepData
): string | null
```

### isStepReachable

Checks if a step is reachable from the current state.

```typescript
function isStepReachable<T extends FlowDefinition>(
  flow: FormFlow<T>,
  state: FlowState<T>,
  stepId: string
): boolean
```

### Example

```typescript
import { computePath, getNextStep, isStepReachable } from '@formachine/core'

const path = computePath(flow, state)
// ['cart', 'shipping', 'payment']

const next = getNextStep(flow, 'cart', { items: [{ id: '1', quantity: 2 }] })
// 'shipping'

const canReach = isStepReachable(flow, state, 'payment')
// true or false
```

---

## Validation Functions

### validateStep

Validates step data against its schema.

```typescript
function validateStep<T extends FlowDefinition>(
  flow: FormFlow<T>,
  stepId: string,
  data: unknown
): ValidationResult
```

### ValidationResult

```typescript
interface ValidationResult {
  success: boolean
  data?: StepData
  errors?: ValidationError[]
}

interface ValidationError {
  path: string[]
  message: string
  code: string
}
```

### createAsyncValidator

Creates an async validator with options.

```typescript
function createAsyncValidator(
  validateFn: (data: unknown) => Promise<boolean>,
  options?: {
    debounce?: number
    cache?: boolean
    retry?: number
    retryDelay?: number
  }
): AsyncValidator
```

### Example

```typescript
import { validateStep, createAsyncValidator } from '@formachine/core'

// Sync validation
const result = validateStep(flow, 'email', { email: 'invalid' })
if (!result.success) {
  console.log(result.errors)
  // [{ path: ['email'], message: 'Invalid email', code: 'invalid_string' }]
}

// Async validation
const checkEmailAvailable = createAsyncValidator(
  async (data) => {
    const response = await fetch(`/api/check-email?email=${data.email}`)
    return response.json().available
  },
  { debounce: 300, cache: true }
)
```

---

## Type Utilities

Type helpers for extracting types from flow definitions.

### InferStepIds

Extracts step IDs as a union type.

```typescript
type InferStepIds<T extends FlowDefinition> = keyof T['steps']

// Usage
type MySteps = InferStepIds<typeof myFlow.definition>
// 'step1' | 'step2' | 'step3'
```

### InferFlowData

Extracts the complete data type for all steps.

```typescript
type InferFlowData<T extends FlowDefinition> = {
  [K in keyof T['steps']]: z.infer<T['steps'][K]['schema']>
}

// Usage
type MyData = InferFlowData<typeof myFlow.definition>
// { step1: { email: string }, step2: { name: string }, ... }
```

### InferStepData

Extracts data type for a specific step.

```typescript
type InferStepData<
  T extends FlowDefinition,
  K extends keyof T['steps']
> = z.infer<T['steps'][K]['schema']>

// Usage
type EmailData = InferStepData<typeof myFlow.definition, 'email'>
// { email: string }
```

---

## State Transitions

### Transition Actions

```typescript
type TransitionAction =
  | { type: 'NEXT'; data?: unknown }
  | { type: 'BACK' }
  | { type: 'GOTO'; step: string }
  | { type: 'RESET'; data?: Partial<FlowData> }
  | { type: 'SET_DATA'; step: string; data: unknown }
```

### transition

Applies a transition action to the current state.

```typescript
function transition<T extends FlowDefinition>(
  flow: FormFlow<T>,
  state: FlowState<T>,
  action: TransitionAction
): FlowState<T>
```

### Example

```typescript
import { transition } from '@formachine/core'

// Go to next step
let newState = transition(flow, state, { type: 'NEXT' })

// Go back
newState = transition(flow, newState, { type: 'BACK' })

// Go to specific step
newState = transition(flow, newState, { type: 'GOTO', step: 'shipping' })

// Reset flow
newState = transition(flow, newState, { type: 'RESET' })
```
