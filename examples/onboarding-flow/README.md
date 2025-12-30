# Onboarding Flow Example

A complete example demonstrating formachine's capabilities through a user onboarding flow.

## Features Demonstrated

- ✨ **Multi-step form** with 5 steps
- 🔀 **Conditional branching** - Different paths for individual vs business users
- 💾 **Persistence** - Progress saved to localStorage with 24h TTL
- ✅ **Zod validation** - Schema-based validation for each step
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 📱 **Responsive** - Works on desktop and mobile

## Flow Structure

```
┌─────────────┐
│   Welcome   │
│ (user type) │
└──────┬──────┘
       │
       ├─── Individual ───┐
       │                  │
       │           ┌──────▼──────┐
       │           │ Personal    │
       │           │ Info        │
       │           └──────┬──────┘
       │                  │
       ├─── Business ─────┤
       │                  │
┌──────▼──────┐           │
│ Business    │           │
│ Info        │           │
└──────┬──────┘           │
       │                  │
       └────────┬─────────┘
                │
         ┌──────▼──────┐
         │ Preferences │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  Complete   │
         │ (confirm)   │
         └─────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# From the project root
pnpm install

# Or from this directory
cd examples/onboarding-flow
pnpm install
```

### Development

```bash
# From the project root
pnpm --filter onboarding-flow dev

# Or from this directory
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) to view the example.

### Build

```bash
pnpm --filter onboarding-flow build
```

## Project Structure

```
onboarding-flow/
├── src/
│   ├── components/
│   │   ├── form/           # Form-specific components
│   │   │   ├── FormError.tsx
│   │   │   ├── FormField.tsx
│   │   │   └── RadioCard.tsx
│   │   ├── layout/         # Layout components
│   │   │   ├── NavigationFooter.tsx
│   │   │   ├── OnboardingLayout.tsx
│   │   │   ├── ProgressHeader.tsx
│   │   │   └── StepCard.tsx
│   │   ├── steps/          # Step components
│   │   │   ├── BusinessInfoStep.tsx
│   │   │   ├── CompleteStep.tsx
│   │   │   ├── PersonalInfoStep.tsx
│   │   │   ├── PreferencesStep.tsx
│   │   │   └── WelcomeStep.tsx
│   │   └── ui/             # shadcn/ui components
│   ├── config/
│   │   └── flow.ts         # Flow definition
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── onboarding.ts   # TypeScript types
├── App.tsx                 # Main app component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Key Files

### Flow Definition

The flow is defined in `src/config/flow.ts`:

```typescript
import { createFormFlow } from '@formachine/core'
import { withPersistence } from '@formachine/persist'
import { localStorage } from '@formachine/persist/adapters'
import { z } from 'zod'

export const onboardingFlowDefinition = createFormFlow({
  id: 'user-onboarding',
  initial: 'welcome',
  steps: {
    welcome: {
      schema: z.object({
        userType: z.enum(['individual', 'business']),
      }),
      // Conditional branching
      next: (data) => 
        data.userType === 'individual' ? 'personalInfo' : 'businessInfo',
    },
    personalInfo: {
      schema: z.object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        email: z.email(),
      }),
      next: 'preferences',
    },
    businessInfo: {
      schema: z.object({
        companyName: z.string().min(2),
        taxId: z.string().min(9),
        email: z.email(),
      }),
      next: 'preferences',
    },
    preferences: {
      schema: z.object({
        notifications: z.boolean(),
        newsletter: z.boolean(),
        theme: z.enum(['light', 'dark', 'auto']),
      }),
      next: 'complete',
    },
    complete: {
      schema: z.object({
        acceptTerms: z.literal(true),
      }),
      next: null,
    },
  },
})

// Wrap with persistence
export const persistedOnboardingFlow = withPersistence(
  onboardingFlowDefinition,
  {
    adapter: localStorage,
    key: 'onboarding-state',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    version: 1,
  }
)
```

### Main App Component

```tsx
// App.tsx
import { useFormFlow, FormFlowProvider, Step, Guard } from '@formachine/react'
import { persistedOnboardingFlow } from './src/config/flow'
import { OnboardingLayout } from './src/components/layout/OnboardingLayout'
import { WelcomeStep } from './src/components/steps/WelcomeStep'
import { PersonalInfoStep } from './src/components/steps/PersonalInfoStep'
import { BusinessInfoStep } from './src/components/steps/BusinessInfoStep'
import { PreferencesStep } from './src/components/steps/PreferencesStep'
import { CompleteStep } from './src/components/steps/CompleteStep'

function App() {
  const flow = useFormFlow(persistedOnboardingFlow, {
    onComplete: async (data) => {
      console.log('Onboarding complete!', data)
      // Submit to your API
    },
  })

  return (
    <FormFlowProvider value={flow}>
      <OnboardingLayout>
        <Step name="welcome">
          <WelcomeStep />
        </Step>
        
        {/* Only shown for individual users */}
        <Guard step="personalInfo">
          <Step name="personalInfo">
            <PersonalInfoStep />
          </Step>
        </Guard>
        
        {/* Only shown for business users */}
        <Guard step="businessInfo">
          <Step name="businessInfo">
            <BusinessInfoStep />
          </Step>
        </Guard>
        
        <Step name="preferences">
          <PreferencesStep />
        </Step>
        
        <Step name="complete">
          <CompleteStep />
        </Step>
      </OnboardingLayout>
    </FormFlowProvider>
  )
}
```

## Persistence

This example uses localStorage persistence with a 24-hour TTL. This means:

- User progress is automatically saved as they move through steps
- If the user closes the browser, they can resume where they left off
- Saved data expires after 24 hours

To test persistence:
1. Fill out the first few steps
2. Close the browser tab
3. Reopen the example - your progress should be restored

To clear saved data:
```javascript
localStorage.removeItem('onboarding-state')
```

## Customization

### Adding a New Step

1. Create a new step component in `src/components/steps/`
2. Add the step to `src/config/flow.ts`
3. Update the `next` property of the previous step
4. Add the step to `App.tsx`

### Changing the Flow Path

Modify the `next` function in `src/config/flow.ts`:

```typescript
welcome: {
  // ...
  next: (data) => {
    // Add your custom logic
    if (data.userType === 'enterprise') {
      return 'enterpriseInfo'
    }
    return data.userType === 'individual' ? 'personalInfo' : 'businessInfo'
  },
},
```

## Technologies Used

- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zod](https://zod.dev/)
- [formachine](../../README.md)

## License

MIT
