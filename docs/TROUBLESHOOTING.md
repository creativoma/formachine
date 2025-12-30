# Troubleshooting Guide

Common issues and their solutions when using FormMachine.

## Table of Contents

- [TypeScript Errors](#typescript-errors)
- [Runtime Errors](#runtime-errors)
- [Steps Not Rendering](#steps-not-rendering)
- [Persistence Issues](#persistence-issues)
- [Validation Problems](#validation-problems)
- [Performance Issues](#performance-issues)

---

## TypeScript Errors

### ❌ Error: Type 'X' is not assignable to type 'Y'

**Problem:**
```typescript
const flow = createFormFlow({
  steps: {
    email: {
      schema: z.object({ email: z.string() }),
      next: 'profile'  // ❌ Type '"profile"' is not assignable to type...
    }
  }
})
```

**Cause:** The `next` step references a step that doesn't exist in the flow definition.

**Solution:**
```typescript
const flow = createFormFlow({
  steps: {
    email: {
      schema: z.object({ email: z.string() }),
      next: 'profile'  // ✅ Make sure 'profile' exists below
    },
    profile: {  // ✅ Add the referenced step
      schema: z.object({ name: z.string() }),
      next: null
    }
  },
  initial: 'email'
})
```

---

### ❌ Error: Argument of type is not assignable to parameter

**Problem:**
```typescript
next: (data: any) => data.accountType === 'business' ? 'company' : 'personal'
```

**Cause:** Using `any` breaks type inference. TypeScript can't verify the step IDs are valid.

**Solution:**
```typescript
next: (data: { accountType: 'business' | 'personal' }) =>
  data.accountType === 'business' ? 'company' : 'personal'
```

---

### ❌ Error: Property 'X' does not exist on type

**Problem:**
```typescript
const { form } = useFormFlow(myFlow)
const email = form.getValues('email')  // ❌ Property 'email' does not exist
```

**Cause:** Accessing field from different step. Each step has its own schema.

**Solution:**
```typescript
// Option 1: Access via getData
const emailData = flow.getData('emailStep')
const email = emailData?.email

// Option 2: Check current step first
if (flow.currentStep === 'emailStep') {
  const email = form.getValues('email')  // ✅ Type-safe
}
```

---

## Runtime Errors

### ❌ Error: Step "X" not found in flow "Y"

**Problem:**
```
Error: Step "payment" not found in flow "checkout"
```

**Cause:** Trying to navigate to a step that doesn't exist in the flow definition.

**Solution:**
```typescript
// Check your flow definition
const flow = createFormFlow({
  steps: {
    cart: { schema: ..., next: 'payment' },  // ❌ 'payment' step missing
  }
})

// Add the missing step
const flow = createFormFlow({
  steps: {
    cart: { schema: ..., next: 'payment' },
    payment: { schema: ..., next: null },  // ✅ Added
  }
})
```

---

### ❌ Error: Circular reference detected

**Problem:**
```
[formachine] Circular reference detected at step: checkout
```

**Cause:** Two or more steps reference each other, creating an infinite loop.

**Solution:**
```typescript
// ❌ Bad: Circular reference
const flow = createFormFlow({
  steps: {
    stepA: { schema: ..., next: 'stepB' },
    stepB: { schema: ..., next: 'stepA' },  // ❌ Goes back to stepA
  }
})

// ✅ Good: Linear or conditional flow
const flow = createFormFlow({
  steps: {
    stepA: { schema: ..., next: 'stepB' },
    stepB: { 
      schema: ..., 
      next: (data) => data.goBack ? null : 'stepC'  // ✅ Conditional
    },
  }
})
```

---

## Steps Not Rendering

### ❌ No step content appears on screen

**Checklist:**

1. **Is FormFlowProvider wrapping your components?**
   ```typescript
   // ❌ Missing provider
   function App() {
     const flow = useFormFlow(myFlow)
     return <div>{flow.currentStep}</div>
   }

   // ✅ With provider
   function App() {
     const flow = useFormFlow(myFlow)
     return (
       <FormFlowProvider value={flow}>
         <MySteps />
       </FormFlowProvider>
     )
   }
   ```

2. **Are you checking the current step correctly?**
   ```typescript
   // ❌ Wrong: using Step component outside provider
   <Step name="email">...</Step>

   // ✅ Correct: conditional rendering
   {flow.currentStep === 'email' && <EmailStep />}
   ```

3. **Is the initial step defined?**
   ```typescript
   const flow = createFormFlow({
     steps: { ... },
     initial: 'firstStep'  // ✅ Must match a step ID
   })
   ```

---

### ❌ Step component renders but fields don't appear

**Problem:** Using `<Step>` component but nothing renders.

**Solution:**
```typescript
// ❌ Wrong: Not using render props
<Step name="email">
  <input name="email" />
</Step>

// ✅ Correct: Use render props
<Step name="email">
  {({ register, formState }) => (
    <>
      <input {...register('email')} />
      {formState.errors.email && <span>Error</span>}
    </>
  )}
</Step>
```

---

## Persistence Issues

### ❌ Data is not persisting between page reloads

**Checklist:**

1. **Did you wrap your flow with `withPersistence`?**
   ```typescript
   import { withPersistence } from '@formachine/persist'
   import { localStorage } from '@formachine/persist/adapters'

   const persistedFlow = withPersistence(myFlow, {
     adapter: localStorage,
     key: 'my-flow-data',
     ttl: 24 * 60 * 60 * 1000  // 24 hours
   })
   ```

2. **Are you hydrating on mount?**
   ```typescript
   useEffect(() => {
     if ('hydrate' in flow) {
       flow.hydrate().then(state => {
         if (state) {
           // Restore state
         }
       })
     }
   }, [])
   ```

3. **Are you calling persist after changes?**
   ```typescript
   const { next } = useFormFlow(persistedFlow, {
     onStepComplete: async () => {
       if ('persist' in persistedFlow) {
         await persistedFlow.persist(state)
       }
     }
   })
   ```

---

### ❌ Persisted data loads but steps are invalidated

**Cause:** Flow definition changed, making old data incompatible with new path.

**Solution:** Use versioning and migrations:
```typescript
const persistedFlow = withPersistence(myFlow, {
  adapter: localStorage,
  key: 'my-flow',
  version: 2,  // ✅ Increment version when flow changes
  migrate: (oldData, oldVersion) => {
    if (oldVersion === 1) {
      // Transform old data to new structure
      return {
        ...oldData,
        newField: 'default-value'
      }
    }
    return oldData
  }
})
```

---

## Validation Problems

### ❌ Validation passes but form has errors

**Problem:** Form accepts invalid data.

**Cause:** Schema doesn't match field names or is too permissive.

**Solution:**
```typescript
// ❌ Mismatch between schema and fields
const schema = z.object({
  email: z.string().email()  // Schema says 'email'
})

<input {...form.register('emailAddress')} />  // ❌ Field is 'emailAddress'

// ✅ Match names exactly
const schema = z.object({
  emailAddress: z.string().email()  // ✅ Matches field name
})

<input {...form.register('emailAddress')} />  // ✅ Correct
```

---

### ❌ Custom validation doesn't trigger

**Problem:** Using Zod `.refine()` but it doesn't run.

**Solution:** Ensure validation is async-compatible:
```typescript
const schema = z.object({
  username: z.string()
    .refine(async (val) => {
      const available = await checkUsername(val)
      return available
    }, {
      message: 'Username is taken'
    })
})
```

---

## Performance Issues

### ❌ Form is slow / Re-renders frequently

**Solutions:**

1. **Memoize flow definition:**
   ```typescript
   // ❌ Creates new flow on every render
   function App() {
     const flow = createFormFlow({ ... })
   }

   // ✅ Create once outside component
   const myFlow = createFormFlow({ ... })
   
   function App() {
     const flow = useFormFlow(myFlow)
   }
   ```

2. **Use React.memo for step components:**
   ```typescript
   const EmailStep = React.memo(() => {
     // Step content
   })
   ```

3. **Avoid inline functions in next:**
   ```typescript
   // ❌ Creates new function on every render
   next: (data) => data.type === 'A' ? 'stepA' : 'stepB'

   // ✅ Define outside (TypeScript may complain, but it's safe)
   const determineNext = (data: StepData) => 
     data.type === 'A' ? 'stepA' : 'stepB'
   
   next: determineNext
   ```

---

## Getting More Help

- 📖 [API Documentation](./api/)
- 💬 [GitHub Discussions](https://github.com/user/formachine/discussions)
- 🐛 [Report a Bug](https://github.com/user/formachine/issues/new)
- 📧 [Contact Support](mailto:support@example.com)

**Still stuck?** Open an issue with:
- FormMachine version
- Minimal reproduction code
- Expected vs actual behavior
- Error messages and stack traces
