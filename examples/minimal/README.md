# Minimal Example

This is the **simplest possible** FormMachine implementation. It demonstrates the core concepts without any advanced features.

## What's included

- ✅ 3 linear steps (name → email → confirm)
- ✅ Basic validation with Zod
- ✅ Navigation (next/back)
- ✅ Type safety

## What's NOT included

- ❌ No conditional branching
- ❌ No persistence
- ❌ No complex UI components
- ❌ No middleware or advanced features

## Running the example

```bash
# From the root of the monorepo
pnpm install

# Run this example
pnpm --filter @formachine/example-minimal dev
```

Then open http://localhost:5173

## Code walkthrough

### 1. Define your flow ([`src/flow.ts`](src/flow.ts))

```typescript
export const minimalFlow = createFormFlow({
  id: 'minimal-example',
  steps: {
    name: {
      schema: z.object({...}),
      next: 'email',  // Static next step
    },
    email: {
      schema: z.object({...}),
      next: 'confirm',
    },
    confirm: {
      schema: z.object({...}),
      next: null,  // Final step
    },
  },
  initial: 'name',
})
```

### 2. Use the flow in your component ([`src/App.tsx`](src/App.tsx))

```typescript
function MinimalForm() {
  const flow = useFormFlow(minimalFlow, {
    onComplete: (data) => {
      console.log('Done!', data)
    },
  })

  return (
    <FormFlowProvider value={flow}>
      {/* Render current step */}
      {flow.currentStep === 'name' && <NameStep />}
      {flow.currentStep === 'email' && <EmailStep />}
      {flow.currentStep === 'confirm' && <ConfirmStep />}
      
      {/* Navigation */}
      <button onClick={flow.back} disabled={!flow.canGoBack}>
        Back
      </button>
      <button onClick={flow.next}>
        Next
      </button>
    </FormFlowProvider>
  )
}
```

### 3. Access form state in each step

```typescript
{flow.currentStep === 'name' && (
  <div>
    <input {...flow.form.register('firstName')} />
    {flow.form.formState.errors.firstName && (
      <span>{flow.form.formState.errors.firstName.message}</span>
    )}
  </div>
)}
```

## Next steps

Once you understand this example, check out the [onboarding-flow example](../onboarding-flow) which demonstrates:

- Conditional branching based on user input
- Persistence with localStorage
- Complex UI components
- Step invalidation
- Error boundaries

## Key concepts

| Concept | Description |
|---------|-------------|
| `createFormFlow()` | Defines your flow structure and validation |
| `useFormFlow()` | React hook that manages flow state |
| `FormFlowProvider` | Context provider for nested components |
| `flow.currentStep` | The currently active step ID |
| `flow.next()` | Validates current step and moves forward |
| `flow.back()` | Moves to the previous step in the path |
| `flow.form` | React Hook Form instance for current step |
