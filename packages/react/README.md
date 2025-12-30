# @formachine/react

> React bindings for formachine - Type-safe, declarative multi-step forms

React components and hooks for building multi-step forms with formachine. Integrates seamlessly with React Hook Form for form state management.

## Installation

```bash
npm install @formachine/react @formachine/core
# or
pnpm add @formachine/react @formachine/core
# or
yarn add @formachine/react @formachine/core
```

### Peer Dependencies

- `react` >= 18.0.0
- `zod` >= 3.0.0

## Features

- 🎣 **Powerful hooks** - `useFormFlow`, `useNavigation`, `useStep`, and more
- 📦 **React Hook Form integration** - Full form state management
- 🔐 **Type-safe** - Complete TypeScript support with inferred types
- 🛡️ **Error boundaries** - Graceful error handling per step
- 🚦 **Guards** - Conditional rendering based on flow state
- ⚡ **Optimistic navigation** - Optional instant transitions
- 🔧 **Flexible architecture** - Headless or with provided components

## Quick Start

### Basic Usage

```tsx
import { createFormFlow } from '@formachine/core'
import { FormFlowProvider, Step, useFormFlow } from '@formachine/react'
import { z } from 'zod'

// Define your flow
const signupFlow = createFormFlow({
  id: 'signup',
  initial: 'account',
  steps: {
    account: {
      schema: z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
      next: 'profile',
    },
    profile: {
      schema: z.object({
        name: z.string().min(2),
        bio: z.string().optional(),
      }),
      next: null,
    },
  },
})

// Create your form component
function SignupForm() {
  const flow = useFormFlow(signupFlow, {
    onComplete: (data) => {
      console.log('Signup complete:', data)
    },
  })

  return (
    <FormFlowProvider value={flow}>
      <Step name="account">
        <AccountStep />
      </Step>
      <Step name="profile">
        <ProfileStep />
      </Step>
      <Navigation />
    </FormFlowProvider>
  )
}

function AccountStep() {
  const { form } = useFormFlow(signupFlow)
  
  return (
    <form>
      <input {...form.register('email')} placeholder="Email" />
      <input {...form.register('password')} type="password" placeholder="Password" />
    </form>
  )
}

function Navigation() {
  const { next, back, canGoBack, canGoNext, isSubmitting } = useFormFlow(signupFlow)
  
  return (
    <div>
      <button onClick={back} disabled={!canGoBack}>Back</button>
      <button onClick={next} disabled={!canGoNext || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Next'}
      </button>
    </div>
  )
}
```

## API Reference

### Hooks

#### `useFormFlow(flow, options?)`

The main hook for managing form flow state.

```typescript
const flow = useFormFlow(myFlow, {
  onComplete: (data) => void,
  onStepComplete: (stepId, stepData) => void,
  onError: (error) => void,
  initialData: { step1: {...} },
  optimisticNavigation: false,
})
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `currentStep` | `string` | Current active step ID |
| `path` | `string[]` | Reachable steps based on current data |
| `completedSteps` | `Set<string>` | Set of completed step IDs |
| `state` | `FlowState` | Full flow state object |
| `form` | `UseFormReturn` | React Hook Form instance |
| `next()` | `() => Promise<boolean>` | Navigate to next step (validates first) |
| `back()` | `() => void` | Navigate to previous step |
| `goTo(step)` | `(step: string) => void` | Navigate to specific step |
| `canGoTo(step)` | `(step: string) => boolean` | Check if navigation is allowed |
| `canGoBack` | `boolean` | Can navigate back |
| `canGoNext` | `boolean` | Can navigate forward |
| `isSubmitting` | `boolean` | Flow is being submitted |
| `isComplete` | `boolean` | Flow is complete |
| `getData(step)` | `(step: string) => data` | Get data for a step |
| `setData(step, data)` | `(step, data) => void` | Set data for a step |
| `reset(data?)` | `(data?) => void` | Reset the flow |

#### `useNavigation()`

Hook for navigation-related state. Must be used within `FormFlowProvider`.

```typescript
const {
  currentStep,
  completedSteps,
  goTo,
  canGoTo,
  next,
  back,
  canGoBack,
  canGoNext,
  isSubmitting,
} = useNavigation()
```

#### `usePath()`

Hook for path-related state and progress tracking.

```typescript
const {
  reachablePath,   // Array of reachable step IDs
  totalSteps,      // Total number of steps in path
  currentIndex,    // Current step index (0-based)
  progress,        // Progress percentage (0-100)
  isFirstStep,     // Is current step first in path
  isLastStep,      // Is current step last in path
} = usePath()
```

#### `useStep(stepId)`

Hook for step-specific state.

```typescript
const {
  stepId,       // Step ID
  isActive,     // Is this the current step
  isCompleted,  // Has this step been completed
  isReachable,  // Is this step in the current path
  data,         // Step data
} = useStep('profile')
```

#### `usePreloadNext(options?)`

Hook for preloading the next step (performance optimization).

```typescript
const {
  nextStepId,      // ID of next step (or null)
  shouldPreload,   // Should preload based on options
  preloadComponent // Whether to render preload component
} = usePreloadNext({
  enabled: true,
  preloadOnIdle: true,
})
```

### Components

#### `<FormFlowProvider>`

Context provider for form flow state.

```tsx
<FormFlowProvider value={flow}>
  {children}
</FormFlowProvider>
```

#### `<Step>`

Renders content only when the step is active.

```tsx
<Step name="account">
  <AccountForm />
</Step>

// With render prop
<Step name="account">
  {({ isActive, isCompleted }) => (
    <div className={isCompleted ? 'completed' : ''}>
      <AccountForm />
    </div>
  )}
</Step>
```

#### `<Guard>`

Conditional rendering based on flow state.

```tsx
// Show when step is in path
<Guard step="payment">
  <PaymentForm />
</Guard>

// Show when step is completed
<Guard completed="account">
  <div>Account setup complete ✓</div>
</Guard>

// Show when step is active
<Guard active="profile">
  <ProfileForm />
</Guard>

// Invert condition
<Guard completed="payment" not>
  <div>Please complete payment</div>
</Guard>

// With fallback
<Guard step="premium" fallback={<UpgradePrompt />}>
  <PremiumFeatures />
</Guard>

// Combined conditions (AND)
<Guard step="checkout" completed="cart">
  <CheckoutButton />
</Guard>
```

#### `<StepErrorBoundary>`

Error boundary for graceful error handling per step.

```tsx
<StepErrorBoundary
  stepId="payment"
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )}
  onError={(error, stepId, errorInfo) => {
    logError(error, { stepId, ...errorInfo })
  }}
>
  <PaymentForm />
</StepErrorBoundary>
```

### `useStepErrorBoundary(stepId, options?)`

Hook to create error boundary wrapper.

```tsx
function MyStep() {
  const wrapWithBoundary = useStepErrorBoundary('payment', {
    fallback: <ErrorUI />,
    onError: handleError,
  })

  return wrapWithBoundary(<PaymentForm />)
}
```

## Advanced Usage

### Progress Indicator

```tsx
function ProgressBar() {
  const { progress, currentIndex, totalSteps } = usePath()
  
  return (
    <div>
      <div 
        className="progress-bar" 
        style={{ width: `${progress}%` }} 
      />
      <span>Step {currentIndex + 1} of {totalSteps}</span>
    </div>
  )
}
```

### Step Navigation with Validation

```tsx
function StepNavigator() {
  const { path, currentStep, goTo, completedSteps } = useNavigation()
  
  return (
    <nav>
      {path.map((stepId, index) => (
        <button
          key={stepId}
          onClick={() => goTo(stepId)}
          disabled={!completedSteps.has(stepId) && stepId !== currentStep}
          className={stepId === currentStep ? 'active' : ''}
        >
          {index + 1}. {stepId}
          {completedSteps.has(stepId) && ' ✓'}
        </button>
      ))}
    </nav>
  )
}
```

### Conditional Steps

```tsx
function CheckoutFlow() {
  const { getData } = useFormFlow(checkoutFlow)
  const cartData = getData('cart')
  
  return (
    <>
      <Step name="cart">
        <CartStep />
      </Step>
      
      <Guard step="shipping">
        <Step name="shipping">
          <ShippingStep />
        </Step>
      </Guard>
      
      {/* Only show if cart has physical items */}
      {cartData?.hasPhysicalItems && (
        <Step name="delivery">
          <DeliveryOptionsStep />
        </Step>
      )}
      
      <Step name="payment">
        <PaymentStep />
      </Step>
    </>
  )
}
```

### Optimistic Navigation

```tsx
const flow = useFormFlow(myFlow, {
  optimisticNavigation: true, // Navigate immediately, validate in background
})
```

## TypeScript

All hooks and components are fully typed. The flow definition infers types automatically:

```typescript
import type { InferStepIds, InferFlowData } from '@formachine/core'

type MySteps = InferStepIds<typeof myFlow.definition>
// 'step1' | 'step2' | 'step3'

type MyData = InferFlowData<typeof myFlow.definition>
// { step1: {...}, step2: {...}, step3: {...} }
```

## License

MIT
