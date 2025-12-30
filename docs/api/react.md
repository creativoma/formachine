# @formachine/react API Reference

Complete API documentation for the React package.

## Table of Contents

- [Hooks](#hooks)
  - [useFormFlow](#useformflow)
  - [useNavigation](#usenavigation)
  - [usePath](#usepath)
  - [useStep](#usestep)
  - [usePreloadNext](#usepreloadnext)
- [Components](#components)
  - [FormFlowProvider](#formflowprovider)
  - [Step](#step)
  - [Guard](#guard)
  - [StepErrorBoundary](#steperrorboundary)
- [Types](#types)

---

## Hooks

### useFormFlow

The main hook for managing form flow state. Provides complete flow control, navigation, and React Hook Form integration.

#### Signature

```typescript
function useFormFlow<T extends FlowDefinition>(
  flow: FormFlow<T>,
  options?: UseFormFlowOptions<T>
): UseFormFlowReturn<T>
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onComplete` | `(data: FlowData) => void \| Promise<void>` | - | Called when flow completes |
| `onStepComplete` | `(stepId: string, data: StepData) => void` | - | Called after each step |
| `onError` | `(error: Error) => void` | - | Called on validation errors |
| `initialData` | `Partial<FlowData>` | `{}` | Pre-populate step data |
| `optimisticNavigation` | `boolean` | `false` | Navigate before validation |

#### Return Value

The `useFormFlow` hook returns an object with all the tools you need to manage your multi-step form:

##### State Properties

| Property | Type | Description | When to use |
|----------|------|-------------|-------------|
| `currentStep` | `string` | ID of the currently active step | Conditionally render step content: `{currentStep === 'email' && <EmailStep />}` |
| `completedSteps` | `Set<string>` | Set of step IDs that have been completed | Show checkmarks in progress indicator, enable step navigation |
| `path` | `string[]` | Array of step IDs in current flow path | Build breadcrumbs, calculate progress percentage |
| `state` | `FlowState<T>` | Complete flow state object | Advanced state management, debugging |
| `isComplete` | `boolean` | Whether all steps are completed | Show success screen: `{isComplete && <ThankYou />}` |
| `isSubmitting` | `boolean` | Whether final submission is in progress | Disable buttons during submission, show loading state |

##### Navigation Methods

| Method | Type | Description | When to use |
|--------|------|-------------|-------------|
| `next()` | `() => Promise<boolean>` | Validates current step and navigates forward | "Next" or "Submit" button: `<button onClick={next}>Next</button>` |
| `back()` | `() => void` | Navigates to previous step in path | "Back" button: `<button onClick={back}>Back</button>` |
| `goTo(step)` | `(step: string) => void` | Navigates directly to a specific step | Custom navigation, sidebar menu, skip to step |
| `canGoTo(step)` | `(step: string) => boolean` | Checks if navigation to step is allowed | Enable/disable navigation links: `disabled={!canGoTo('review')}` |
| `canGoBack` | `boolean` | Whether back navigation is possible | Disable back button on first step: `disabled={!canGoBack}` |
| `canGoNext` | `boolean` | Whether forward navigation is possible | Show "Complete" vs "Next" button |
| `reset(data?)` | `(data?: Partial) => void` | Resets flow to initial state | "Start Over" button, cancel flow |

##### Form Integration

| Property | Type | Description | When to use |
|----------|------|-------------|-------------|
| `form` | `UseFormReturn` | React Hook Form instance for current step | Access `register`, `formState.errors`, `watch`, etc. |

##### Data Management

| Method | Type | Description | When to use |
|--------|------|-------------|-------------|
| `getData(step)` | `(step: string) => StepData \| undefined` | Get data for a specific step | Show summary, pre-fill fields, conditional logic |
| `setData(step, data)` | `(step: string, data: StepData) => void` | Update data for a specific step | Change previous answers, bulk data update |

#### Quick Reference

```typescript
// Basic navigation
const { currentStep, next, back, canGoBack } = useFormFlow(flow)

// Form integration
const { form } = useFormFlow(flow)
<input {...form.register('email')} />
{form.formState.errors.email && <span>Error!</span>}

// Progress tracking
const { path, completedSteps, currentStep } = useFormFlow(flow)
const progress = (completedSteps.size / path.length) * 100

// Completion handling
const { isComplete, isSubmitting } = useFormFlow(flow)
if (isComplete) return <SuccessScreen />
```

#### Example

```typescript
import { useFormFlow } from '@formachine/react'

function MyForm() {
  const {
    currentStep,
    form,
    next,
    back,
    canGoBack,
    isSubmitting,
  } = useFormFlow(myFlow, {
    onComplete: async (data) => {
      await submitToAPI(data)
    },
    onStepComplete: (stepId, stepData) => {
      analytics.track('step_completed', { stepId })
    },
  })

  return (
    <form onSubmit={form.handleSubmit(() => next())}>
      {/* form fields */}
    </form>
  )
}
```

---

### useNavigation

Hook for navigation-related state. Must be used within `FormFlowProvider`.

#### Signature

```typescript
function useNavigation(): NavigationState
```

#### Return Value

```typescript
interface NavigationState {
  currentStep: string
  completedSteps: Set<string>
  goTo: (step: string) => void
  canGoTo: (step: string) => boolean
  next: () => Promise<boolean>
  back: () => void
  canGoBack: boolean
  canGoNext: boolean
  isSubmitting: boolean
}
```

#### Example

```typescript
import { useNavigation } from '@formachine/react'

function NavigationButtons() {
  const { next, back, canGoBack, canGoNext, isSubmitting } = useNavigation()
  
  return (
    <div>
      <button onClick={back} disabled={!canGoBack}>
        Back
      </button>
      <button onClick={next} disabled={!canGoNext || isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Next'}
      </button>
    </div>
  )
}
```

---

### usePath

Hook for path-related state and progress tracking.

#### Signature

```typescript
function usePath(): PathState
```

#### Return Value

```typescript
interface PathState {
  /** Array of reachable step IDs */
  reachablePath: string[]
  
  /** Total number of steps in current path */
  totalSteps: number
  
  /** Current step index (0-based) */
  currentIndex: number
  
  /** Progress percentage (0-100) */
  progress: number
  
  /** Is current step first in path */
  isFirstStep: boolean
  
  /** Is current step last in path */
  isLastStep: boolean
}
```

#### Example

```typescript
import { usePath } from '@formachine/react'

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

---

### useStep

Hook for step-specific state.

#### Signature

```typescript
function useStep(stepId: string): StepState
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stepId` | `string` | The step ID to get state for |

#### Return Value

```typescript
interface StepState {
  /** The step ID */
  stepId: string
  
  /** Is this the current active step */
  isActive: boolean
  
  /** Has this step been completed */
  isCompleted: boolean
  
  /** Is this step in the current reachable path */
  isReachable: boolean
  
  /** Data for this step, if any */
  data: StepData | undefined
}
```

#### Example

```typescript
import { useStep } from '@formachine/react'

function StepIndicator({ stepId }: { stepId: string }) {
  const { isActive, isCompleted, isReachable } = useStep(stepId)
  
  return (
    <div className={cn(
      'step-indicator',
      isActive && 'active',
      isCompleted && 'completed',
      !isReachable && 'disabled'
    )}>
      {isCompleted ? '✓' : stepId}
    </div>
  )
}
```

---

### usePreloadNext

Hook for preloading the next step component.

#### Signature

```typescript
function usePreloadNext(options?: PreloadOptions): PreloadInfo
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable preloading |
| `preloadOnIdle` | `boolean` | `true` | Use requestIdleCallback |

#### Return Value

```typescript
interface PreloadInfo {
  /** ID of next step, or null if last */
  nextStepId: string | null
  
  /** Should preload based on options */
  shouldPreload: boolean
  
  /** Whether to render preload component */
  preloadComponent: boolean
}
```

#### Example

```typescript
import { usePreloadNext } from '@formachine/react'

function StepContainer({ children }) {
  const { nextStepId, preloadComponent } = usePreloadNext({
    enabled: true,
    preloadOnIdle: true,
  })
  
  return (
    <div>
      {children}
      {preloadComponent && nextStepId && (
        <div style={{ display: 'none' }}>
          <PreloadedStep stepId={nextStepId} />
        </div>
      )}
    </div>
  )
}
```

---

## Components

### FormFlowProvider

Context provider for form flow state.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `UseFormFlowReturn` | The flow instance from `useFormFlow` |
| `children` | `ReactNode` | Child components |

#### Example

```tsx
import { FormFlowProvider, useFormFlow } from '@formachine/react'

function App() {
  const flow = useFormFlow(myFlow)
  
  return (
    <FormFlowProvider value={flow}>
      <StepContent />
      <Navigation />
    </FormFlowProvider>
  )
}
```

---

### Step

Renders content only when the specified step is active.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | The step ID |
| `children` | `ReactNode \| RenderProp` | Content or render function |

#### Render Prop

```typescript
type RenderProp = (props: {
  isActive: boolean
  isCompleted: boolean
  isReachable: boolean
}) => ReactNode
```

#### Example

```tsx
import { Step } from '@formachine/react'

// Simple usage
<Step name="account">
  <AccountForm />
</Step>

// With render prop
<Step name="account">
  {({ isCompleted }) => (
    <div className={isCompleted ? 'completed' : ''}>
      <AccountForm />
    </div>
  )}
</Step>
```

---

### Guard

Conditional rendering based on flow state.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `step` | `string` | Show when step is in path |
| `completed` | `string` | Show when step is completed |
| `active` | `string` | Show when step is active |
| `not` | `boolean` | Invert the condition |
| `fallback` | `ReactNode` | Content when condition is false |
| `children` | `ReactNode` | Content when condition is true |

#### Examples

```tsx
import { Guard } from '@formachine/react'

// Show when step is in path
<Guard step="payment">
  <PaymentForm />
</Guard>

// Show when step is completed
<Guard completed="account">
  <span>Account ✓</span>
</Guard>

// Show when step is active
<Guard active="profile">
  <ProfileForm />
</Guard>

// Invert condition
<Guard completed="payment" not>
  <span>Payment required</span>
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

---

### StepErrorBoundary

Error boundary for graceful error handling per step.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `stepId` | `string` | The step ID for error tracking |
| `fallback` | `ReactNode \| FallbackRender` | Fallback UI on error |
| `onError` | `(error, stepId, errorInfo) => void` | Error callback |
| `children` | `ReactNode` | Step content |

#### FallbackRender

```typescript
type FallbackRender = (error: Error, reset: () => void) => ReactNode
```

#### Example

```tsx
import { StepErrorBoundary } from '@formachine/react'

<StepErrorBoundary
  stepId="payment"
  fallback={(error, reset) => (
    <div>
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
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

---

## Types

### UseFormFlowOptions

```typescript
interface UseFormFlowOptions<T extends FlowDefinition> {
  onComplete?: (data: InferFlowData<T>) => void | Promise<void>
  onStepComplete?: (stepId: InferStepIds<T>, data: unknown) => void
  onError?: (error: Error) => void
  initialData?: Partial<InferFlowData<T>>
  optimisticNavigation?: boolean
}
```

### GuardProps

```typescript
interface GuardProps {
  step?: string
  completed?: string
  active?: string
  not?: boolean
  fallback?: ReactNode
  children: ReactNode
}
```

### StepErrorBoundaryProps

```typescript
interface StepErrorBoundaryProps {
  stepId: string
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, stepId: string, errorInfo: ErrorInfo) => void
  children: ReactNode
}
```
