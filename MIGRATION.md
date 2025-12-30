# Migration Guide

This guide helps you migrate to Formachine from other multi-step form solutions or custom implementations.

## Table of Contents

- [From Manual State Management](#from-manual-state-management)
- [From React Hook Form (Manual Steps)](#from-react-hook-form-manual-steps)
- [From Formik Multi-Step](#from-formik-multi-step)
- [From Custom useReducer](#from-custom-usereducer)
- [From Multi-Page Forms](#from-multi-page-forms)

---

## From Manual State Management

### Before (Manual useState)

```tsx
function SignupForm() {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    accountType: 'personal',
    companyName: '',
  })

  const handleNext = () => {
    if (step === 1 && formData.accountType === 'personal') {
      setStep(3) // Skip company info
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step === 3 && formData.accountType === 'personal') {
      setStep(1) // Skip back over company
    } else {
      setStep(step - 1)
    }
  }

  return (
    <div>
      {step === 0 && <EmailStep />}
      {step === 1 && <NameStep />}
      {step === 2 && <CompanyStep />}
      {step === 3 && <CompleteStep />}
    </div>
  )
}
```

### After (With Formachine)

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow, FormFlowProvider, Step } from '@formachine/react'
import { z } from 'zod'

const signupFlow = createFormFlow({
  id: 'signup',
  steps: {
    email: {
      schema: z.object({ email: z.string().email() }),
      next: 'name',
    },
    name: {
      schema: z.object({
        name: z.string(),
        accountType: z.enum(['personal', 'business']),
      }),
      next: (data) => data.accountType === 'business' ? 'company' : 'complete',
    },
    company: {
      schema: z.object({ companyName: z.string() }),
      next: 'complete',
    },
    complete: {
      schema: z.object({ accepted: z.boolean() }),
      next: null,
    },
  },
  initial: 'email',
})

function SignupForm() {
  const formFlow = useFormFlow(signupFlow, {
    onComplete: async (data) => {
      await submitSignup(data)
    },
  })

  return (
    <FormFlowProvider value={formFlow}>
      <Step name="email">
        {({ register, errors, submit }) => (
          <form onSubmit={submit}>
            <input {...register('email')} />
            {errors.email && <span>{errors.email.message}</span>}
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="name">
        {({ register, submit, back }) => (
          <form onSubmit={submit}>
            <input {...register('name')} />
            <select {...register('accountType')}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
            <button type="button" onClick={back}>Back</button>
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="company">
        {({ register, submit, back }) => (
          <form onSubmit={submit}>
            <input {...register('companyName')} />
            <button type="button" onClick={back}>Back</button>
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="complete">
        {({ register, submit, back, isSubmitting }) => (
          <form onSubmit={submit}>
            <input {...register('accepted')} type="checkbox" />
            <button type="button" onClick={back}>Back</button>
            <button type="submit" disabled={isSubmitting}>
              Complete
            </button>
          </form>
        )}
      </Step>
    </FormFlowProvider>
  )
}
```

**Benefits:**
- ✅ Automatic validation with Zod schemas
- ✅ Type-safe data access
- ✅ Branching logic defined declaratively
- ✅ No manual path calculation
- ✅ Built-in back button handling

---

## From React Hook Form (Manual Steps)

### Before

```tsx
function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const methods = useForm()

  const onSubmit = (data) => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      submitForm(data)
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {currentStep === 0 && <Step1 />}
        {currentStep === 1 && <Step2 />}
        {currentStep === 2 && <Step3 />}
        <button type="submit">
          {currentStep < 2 ? 'Next' : 'Submit'}
        </button>
      </form>
    </FormProvider>
  )
}
```

### After

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow, FormFlowProvider, Step } from '@formachine/react'
import { z } from 'zod'

const flow = createFormFlow({
  id: 'multi-step',
  steps: {
    step1: {
      schema: z.object({ field1: z.string() }),
      next: 'step2',
    },
    step2: {
      schema: z.object({ field2: z.string() }),
      next: 'step3',
    },
    step3: {
      schema: z.object({ field3: z.string() }),
      next: null,
    },
  },
  initial: 'step1',
})

function MultiStepForm() {
  const formFlow = useFormFlow(flow, {
    onComplete: (data) => submitForm(data),
  })

  return (
    <FormFlowProvider value={formFlow}>
      <Step name="step1">
        {({ register, submit }) => (
          <form onSubmit={submit}>
            <input {...register('field1')} />
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="step2">
        {({ register, submit, back }) => (
          <form onSubmit={submit}>
            <input {...register('field2')} />
            <button type="button" onClick={back}>Back</button>
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="step3">
        {({ register, submit, back }) => (
          <form onSubmit={submit}>
            <input {...register('field3')} />
            <button type="button" onClick={back}>Back</button>
            <button type="submit">Submit</button>
          </form>
        )}
      </Step>
    </FormFlowProvider>
  )
}
```

**Benefits:**
- ✅ Still uses React Hook Form under the hood
- ✅ Automatic step management
- ✅ Type-safe schemas with Zod
- ✅ Built-in progress tracking

---

## From Formik Multi-Step

### Before

```tsx
import { Formik, Form } from 'formik'
import * as Yup from 'yup'

const Step1Schema = Yup.object({ email: Yup.string().email().required() })
const Step2Schema = Yup.object({ name: Yup.string().required() })

function MultiStepFormik() {
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({})

  const handleSubmit = (newValues) => {
    setValues({ ...values, ...newValues })
    if (step === 1) {
      submitForm({ ...values, ...newValues })
    } else {
      setStep(step + 1)
    }
  }

  return (
    <>
      {step === 0 && (
        <Formik
          initialValues={{ email: '' }}
          validationSchema={Step1Schema}
          onSubmit={handleSubmit}
        >
          <Form>
            <Field name="email" />
            <button type="submit">Next</button>
          </Form>
        </Formik>
      )}
      {step === 1 && (
        <Formik
          initialValues={{ name: '' }}
          validationSchema={Step2Schema}
          onSubmit={handleSubmit}
        >
          <Form>
            <Field name="name" />
            <button type="button" onClick={() => setStep(0)}>Back</button>
            <button type="submit">Submit</button>
          </Form>
        </Formik>
      )}
    </>
  )
}
```

### After

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow, FormFlowProvider, Step } from '@formachine/react'
import { z } from 'zod'

const flow = createFormFlow({
  id: 'signup',
  steps: {
    email: {
      schema: z.object({ email: z.string().email() }),
      next: 'name',
    },
    name: {
      schema: z.object({ name: z.string().min(1) }),
      next: null,
    },
  },
  initial: 'email',
})

function MultiStepForm() {
  const formFlow = useFormFlow(flow, {
    onComplete: (data) => submitForm(data),
  })

  return (
    <FormFlowProvider value={formFlow}>
      <Step name="email">
        {({ register, errors, submit }) => (
          <form onSubmit={submit}>
            <input {...register('email')} />
            {errors.email && <span>{errors.email.message}</span>}
            <button type="submit">Next</button>
          </form>
        )}
      </Step>

      <Step name="name">
        {({ register, errors, submit, back }) => (
          <form onSubmit={submit}>
            <input {...register('name')} />
            {errors.name && <span>{errors.name.message}</span>}
            <button type="button" onClick={back}>Back</button>
            <button type="submit">Submit</button>
          </form>
        )}
      </Step>
    </FormFlowProvider>
  )
}
```

**Migration Notes:**
- Replace `Yup` schemas with `Zod` schemas
- Remove manual step state management
- Remove manual value aggregation (Formachine handles this)
- Use render props pattern instead of Formik components

---

## From Custom useReducer

### Before

```tsx
const formReducer = (state, action) => {
  switch (action.type) {
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1, data: { ...state.data, ...action.payload } }
    case 'PREV_STEP':
      return { ...state, step: state.step - 1 }
    case 'RESET':
      return { step: 0, data: {} }
    default:
      return state
  }
}

function Form() {
  const [state, dispatch] = useReducer(formReducer, { step: 0, data: {} })

  const handleNext = (data) => {
    dispatch({ type: 'NEXT_STEP', payload: data })
  }

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' })
  }

  return <div>{/* render steps based on state.step */}</div>
}
```

### After

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow } from '@formachine/react'
import { z } from 'zod'

const flow = createFormFlow({
  id: 'form',
  steps: {
    step1: {
      schema: z.object({ field: z.string() }),
      next: 'step2',
    },
    step2: {
      schema: z.object({ field: z.string() }),
      next: null,
    },
  },
  initial: 'step1',
})

function Form() {
  const { next, back, reset, currentStep } = useFormFlow(flow)

  // next, back, and reset are built-in
  // currentStep tells you which step is active
}
```

**Benefits:**
- ✅ No need to write reducer logic
- ✅ Type-safe actions
- ✅ Built-in validation
- ✅ Path recalculation on data changes

---

## From Multi-Page Forms

If you're using routing for multi-step forms (e.g., `/signup/step1`, `/signup/step2`), you can replace this with Formachine while keeping URLs if needed.

### Before

```tsx
// Route: /signup/email
function EmailPage() {
  const navigate = useNavigate()
  const handleSubmit = (data) => {
    saveToSession(data)
    navigate('/signup/name')
  }
  return <form onSubmit={handleSubmit}>...</form>
}

// Route: /signup/name
function NamePage() {
  const navigate = useNavigate()
  const handleSubmit = (data) => {
    const allData = { ...getFromSession(), ...data }
    submitForm(allData)
    navigate('/signup/complete')
  }
  return <form onSubmit={handleSubmit}>...</form>
}
```

### After (Option 1: Single Page)

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow, FormFlowProvider, Step } from '@formachine/react'
import { z } from 'zod'

const signupFlow = createFormFlow({
  id: 'signup',
  steps: {
    email: { schema: z.object({ email: z.string().email() }), next: 'name' },
    name: { schema: z.object({ name: z.string() }), next: null },
  },
  initial: 'email',
})

function SignupPage() {
  const formFlow = useFormFlow(signupFlow, {
    onComplete: (data) => submitForm(data),
  })

  return (
    <FormFlowProvider value={formFlow}>
      <Step name="email">{/* ... */}</Step>
      <Step name="name">{/* ... */}</Step>
    </FormFlowProvider>
  )
}
```

### After (Option 2: Keep Routes with Sync)

```tsx
import { createFormFlow } from '@formachine/core'
import { useFormFlow, FormFlowProvider, Step } from '@formachine/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { z } from 'zod'

const signupFlow = createFormFlow({
  id: 'signup',
  steps: {
    email: { schema: z.object({ email: z.string().email() }), next: 'name' },
    name: { schema: z.object({ name: z.string() }), next: null },
  },
  initial: 'email',
})

function SignupPage() {
  const { step } = useParams()
  const navigate = useNavigate()

  const formFlow = useFormFlow(signupFlow)

  // Sync URL with current step
  useEffect(() => {
    if (step !== formFlow.currentStep) {
      navigate(`/signup/${formFlow.currentStep}`)
    }
  }, [formFlow.currentStep, navigate, step])

  // Sync current step with URL
  useEffect(() => {
    if (step && step !== formFlow.currentStep && formFlow.canGoTo(step)) {
      formFlow.goTo(step)
    }
  }, [step, formFlow])

  return (
    <FormFlowProvider value={formFlow}>
      <Step name="email">{/* ... */}</Step>
      <Step name="name">{/* ... */}</Step>
    </FormFlowProvider>
  )
}
```

**Benefits:**
- ✅ No session storage needed (Formachine tracks state)
- ✅ Optional: Add `@formachine/persist` for browser refresh support
- ✅ Can still use URLs if needed for shareable links

---

## Adding Persistence

If you were using `localStorage` or `sessionStorage` to persist form data:

### Before

```tsx
useEffect(() => {
  const saved = localStorage.getItem('formData')
  if (saved) {
    setFormData(JSON.parse(saved))
  }
}, [])

useEffect(() => {
  localStorage.setItem('formData', JSON.stringify(formData))
}, [formData])
```

### After

```tsx
import { createFormFlow } from '@formachine/core'
import { withPersistence, localStorage } from '@formachine/persist'
import { useFormFlow } from '@formachine/react'

const flow = createFormFlow({
  /* ... */
})

const persistedFlow = withPersistence(flow, {
  adapter: localStorage,
  key: 'my-form',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  version: 1,
})

function MyForm() {
  const formFlow = useFormFlow(persistedFlow)

  useEffect(() => {
    persistedFlow.hydrate(formFlow.setData) // Load from storage
  }, [])

  useEffect(() => {
    persistedFlow.persist(formFlow.state.data) // Auto-save
  }, [formFlow.state.data])
}
```

---

## Common Patterns

### Conditional Steps (Branching)

**Before:**
```tsx
const nextStep = currentStep === 'profile' && data.type === 'business'
  ? 'company'
  : 'preferences'
```

**After:**
```tsx
{
  profile: {
    schema: z.object({ type: z.enum(['personal', 'business']) }),
    next: (data) => data.type === 'business' ? 'company' : 'preferences',
  }
}
```

### Progress Tracking

**Before:**
```tsx
const progress = (currentStep / totalSteps) * 100
```

**After:**
```tsx
import { usePath } from '@formachine/react'

const { progress } = usePath()
```

### Validation

**Before:**
```tsx
const errors = {}
if (!data.email.includes('@')) {
  errors.email = 'Invalid email'
}
```

**After:**
```tsx
{
  email: {
    schema: z.object({
      email: z.string().email('Invalid email'),
    }),
    next: 'next-step',
  }
}
```

---

## Migration Checklist

- [ ] Install dependencies: `pnpm add @formachine/core @formachine/react zod`
- [ ] Convert validation schemas to Zod
- [ ] Define flow using `createFormFlow`
- [ ] Replace manual state management with `useFormFlow`
- [ ] Update step components to use render props pattern
- [ ] Test branching logic
- [ ] Add persistence if needed (`@formachine/persist`)
- [ ] Update TypeScript types (they're inferred automatically!)

---

## Getting Help

- [Documentation](./README.md)
- [Examples](./examples)
- [GitHub Issues](https://github.com/{user}/formachine/issues)

---

## Performance Considerations

- Formachine uses React Hook Form internally, so performance is similar
- Path recalculation only happens when data changes
- Use `optimisticNavigation` option for faster perceived navigation
- Use `usePreloadNext` to preload next step for instant transitions
