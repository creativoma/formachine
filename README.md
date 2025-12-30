![cover](./public/cover.avif)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-439%20passing-success)](./package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Type-safe, declarative multi-step forms for React**

A library for building complex multi-step forms with **branching logic**, **persistence**, and **end-to-end type safety**. Built on top of React Hook Form and Zod.

## Features

- **Declarative Flow Definition** - Define your form as a state machine
- **Conditional Branching** - Dynamic paths based on user input
- **Persistence** - localStorage, sessionStorage, or custom adapters
- **TTL & Versioning** - Automatic data expiration and migrations
- **Async Validation** - Debounced, cached, retryable validations
- **Type Safety** - Full TypeScript inference from Zod schemas
- **React Integration** - Hooks and components for seamless UX
- **Well Tested** - 439 tests passing

## Quick Start

### Requirements

- Node.js >= 22
- pnpm >= 9

### Installation

```bash
npm install @creativoma/formachine zod react-hook-form


# Or with pnpm
pnpm add @creativoma/formachine zod react-hook-form

```

### Basic Example

```tsx
import { z } from 'zod'
import { createFormFlow } from '@creativoma/formachine/core'
import { useFormFlow, Step } from '@creativoma/formachine'

// 1. Define your flow
const signupFlow = createFormFlow({
  id: 'signup',
  steps: {
    email: {
      schema: z.object({
        email: z.string().email(),
      }),
      next: 'password',
    },
    password: {
      schema: z.object({
        password: z.string().min(8),
      }),
      next: null,
    },
  },
  initial: 'email',
})

// 2. Use in your component
function SignupForm() {
  const flow = useFormFlow(signupFlow, {
    onComplete: async (data) => {
      console.log('Signup complete!', data)
      // Submit to your API
    },
  })

  return (
    <div>
      <Step flow={flow} step="email">
        <input {...flow.form.register('email')} />
      </Step>

      <Step flow={flow} step="password">
        <input type="password" {...flow.form.register('password')} />
      </Step>

      <button onClick={() => flow.next()}>
        Continue
      </button>
    </div>
  )
}
```

### Minimal Example

For a complete working example, check out the [minimal example](./examples/minimal):

```tsx
// flow.ts
import { createFormFlow } from '@creativoma/formachine/core'
import { z } from 'zod'

export const minimalFlow = createFormFlow({
  id: 'minimal-example',
  steps: {
    name: {
      schema: z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
      }),
      next: 'email',
    },
    email: {
      schema: z.object({
        email: z.string().email('Invalid email address'),
      }),
      next: 'confirm',
    },
    confirm: {
      schema: z.object({
        agreeToTerms: z.boolean().refine((val) => val === true, {
          message: 'You must agree to the terms',
        }),
      }),
      next: null,
    },
  },
  initial: 'name',
})
```

```tsx
// App.tsx
import { useFormFlow, FormFlowProvider } from '@creativoma/formachine'
import { minimalFlow } from './flow'

function MinimalForm() {
  const flow = useFormFlow(minimalFlow, {
    onComplete: (data) => {
      console.log('Form completed!', data)
    },
  })

  return (
    <FormFlowProvider value={flow}>
      <div>
        {/* Step 1: Name */}
        {flow.currentStep === 'name' && (
          <div>
            <input {...flow.form.register('firstName')} placeholder="First Name" />
            <input {...flow.form.register('lastName')} placeholder="Last Name" />
          </div>
        )}

        {/* Step 2: Email */}
        {flow.currentStep === 'email' && (
          <div>
            <input {...flow.form.register('email')} placeholder="Email" type="email" />
          </div>
        )}

        {/* Step 3: Confirm */}
        {flow.currentStep === 'confirm' && (
          <div>
            <label>
              <input type="checkbox" {...flow.form.register('agreeToTerms')} />
              I agree to the terms
            </label>
          </div>
        )}

        {/* Navigation */}
        <div>
          {flow.canGoBack && <button onClick={flow.back}>Back</button>}
          <button onClick={flow.next}>
            {flow.currentStep === 'confirm' ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </FormFlowProvider>
  )
}
```

## 📚 Learning Path

New to FormMachine? Follow this recommended learning path:

1. **Start here**: [Minimal Example](examples/minimal) - Simplest possible implementation (3 steps, no extras)
2. **Level up**: [Onboarding Flow Example](examples/onboarding-flow) - Real-world app with branching, persistence, and UI
3. **Deep dive**: [API Documentation](docs/api) - Complete reference for all features

Each example builds on the previous one, gradually introducing more concepts.

## Advanced Features

### Conditional Branching

```tsx
const surveyFlow = createFormFlow({
  id: 'survey',
  steps: {
    question1: {
      schema: z.object({
        satisfied: z.boolean(),
      }),
      // Dynamic next step based on answer
      next: (data) => (data.satisfied ? 'thankYou' : 'feedback'),
    },
    feedback: {
      schema: z.object({
        reason: z.string().min(10),
      }),
      next: 'thankYou',
    },
    thankYou: {
      schema: z.object({ done: z.boolean() }),
      next: null,
    },
  },
  initial: 'question1',
})
```

### Persistence with TTL

```tsx
import { withPersistence } from '@creativoma/formachine/persist'
import { localStorage } from '@creativoma/formachine/persist'

const persistedFlow = withPersistence(signupFlow, {
  adapter: localStorage,
  key: 'signup-progress',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  version: 1,
})

function App() {
  const flow = useFormFlow(persistedFlow, {
    onStepComplete: async (stepId, stepData) => {
      // Auto-save after each step
      await persistedFlow.persist(flow.state)
    },
  })

  // Hydrate on mount
  useEffect(() => {
    persistedFlow.hydrate().then((savedState) => {
      if (savedState) {
        // State restored automatically
        console.log('Restored from localStorage')
      }
    })
  }, [])

  return <YourForm />
}
```

### Async Validation with Retry

```tsx
import { debounce, withRetry } from '@creativoma/formachine/core'

const checkEmailAvailability = debounce(async (email: string) => {
  return withRetry(
    async () => {
      const response = await fetch(`/api/check-email?email=${email}`)
      return response.json()
    },
    { maxAttempts: 3, delay: 1000 }
  )
}, 300)

const schema = z.object({
  email: z.string().email().refine(
    async (email) => {
      const { available } = await checkEmailAvailability(email)
      return available
    },
    { message: 'Email already taken' }
  ),
})
```

## API Reference

### Core Package (`@creativoma/formachine/core`)

#### `createFormFlow(definition)`

Creates a form flow state machine.

```tsx
const flow = createFormFlow({
  id: 'unique-id',
  steps: {
    stepName: {
      schema: zodSchema,      // Zod schema for validation
      next: 'nextStep' | fn,  // Static or dynamic next step
    },
  },
  initial: 'firstStep',
})
```

#### Validation Utilities

```tsx
import {
  debounce,              // Debounce async functions
  withRetry,            // Retry failed operations
  createAbortableValidation, // Cancel in-flight validations
  createValidationCache,     // Cache validation results
} from '@creativoma/formachine/core'
```

### React Package (`@creativoma/formachine`)

#### `useFormFlow(flow, options)`

Main hook for form flow state management.

```tsx
const {
  // Navigation
  currentStep,
  next,           // () => Promise<boolean>
  back,           // () => void
  goTo,           // (step) => void
  reset,          // (data?) => void

  // State
  path,           // string[] - current path through flow
  completedSteps, // Set<string> - completed steps
  isComplete,     // boolean
  isSubmitting,   // boolean

  // Data
  getData,        // (step) => data
  setData,        // (step, data) => void

  // Form (react-hook-form)
  form,           // UseFormReturn
} = useFormFlow(flow, {
  onComplete: async (data) => {},      // Called when flow completes
  onStepComplete: async (step, data) => {}, // Called after each step
  onError: (error) => {},             // Error handler
  initialData: {},                    // Pre-populate data
})
```

#### `<Step>` Component

Renders content for specific step.

```tsx
<Step flow={flow} step="stepName">
  <YourStepContent />
</Step>
```

### Persist Package (`@creativoma/formachine/persist`)

#### `withPersistence(flow, options)`

Adds persistence to a flow.

```tsx
const persistedFlow = withPersistence(flow, {
  adapter: localStorage,        // or sessionStorage, or custom
  key: 'storage-key',
  ttl: 24 * 60 * 60 * 1000,    // Optional: expiration time
  version: 1,                   // Optional: for migrations
  migrate: (oldData, oldVersion) => newData, // Optional: migration fn
})

// Methods
await persistedFlow.persist(state)    // Save state
await persistedFlow.hydrate()         // Load state
await persistedFlow.clear()           // Clear storage
```

#### Adapters

```tsx
import {
  localStorage,
  sessionStorage,
  createAdapter,
} from '@creativoma/formachine/persist'

// Custom adapter
const customAdapter = createAdapter({
  getItem: async (key) => { /* ... */ },
  setItem: async (key, value) => { /* ... */ },
  removeItem: async (key) => { /* ... */ },
})
```

## Type Safety

Full type inference from your Zod schemas:

```tsx
const flow = createFormFlow({
  steps: {
    user: {
      schema: z.object({
        name: z.string(),
        age: z.number(),
      }),
      next: 'done',
    },
    done: { schema: z.object({}), next: null },
  },
  initial: 'user',
})

// TypeScript knows the exact shape!
flow.onComplete((data) => {
  data.user.name  // ✅ string
  data.user.age   // ✅ number
  data.user.email // ❌ TypeScript error
})
```

## Examples

See the [`examples/`](./examples) directory:

- **[onboarding-flow](./examples/onboarding-flow)** - Multi-step onboarding with branching, persistence, and conditional logic
- **[minimal](./examples/minimal)** - Simplest possible multi-step form

## Architecture

FormMachine is built as a monorepo with focused packages:

- **`@creativoma/formachine/core`** - State machine, validation, utilities
- **`@creativoma/formachine`** - React hooks and components
- **`@creativoma/formachine/persist`** - Persistence adapters

## Testing & Coverage

### Run Tests

```bash
pnpm test              # Run tests in watch mode
pnpm test:run          # Run tests once
```

### Coverage Reports

```bash
pnpm coverage          # Generate coverage report
pnpm coverage:ui       # Generate and open HTML report
```

Coverage reports are generated in the `coverage/` directory:
- **Terminal:** Text summary shown in console
- **JSON:** `coverage/coverage-final.json`
- **HTML:** `coverage/index.html` (interactive report)

### Coverage Configuration

The project uses Vitest with V8 coverage provider. Configuration in `vitest.config.ts`:
- Includes all source files in `packages/*/src/**/*.{ts,tsx}`
- Excludes test files and index exports
- Generates text, JSON, and HTML reports

## Contributing

Contributions are welcome! Please read our [contributing guide](./CONTRIBUTING.md).

```bash
# Clone the repository
git clone https://github.com/creativoma/formachine.git
cd formachine

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build

# Run the example
pnpm --filter onboarding-flow-example dev
```

## License

MIT © Mariano Álvarez

## Acknowledgments

- [React Hook Form](https://react-hook-form.com/) - Form primitives
- [Zod](https://zod.dev/) - Schema validation
- [XState](https://xstate.js.org/) - State machine concepts
