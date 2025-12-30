import { FormFlowProvider, useFormFlow } from '@creativoma/formachine'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { OnboardingLayout } from './src/components/layout/OnboardingLayout'
import { persistedOnboardingFlow } from './src/config/flow'

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false)

  const flowContext = useFormFlow(persistedOnboardingFlow, {
    onComplete: async (data) => {
      console.log('Onboarding complete!', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Onboarding complete! Check the console for your data.')
      await persistedOnboardingFlow.clear()
    },
    onStepComplete: async (stepId, stepData) => {
      console.log(`Step ${stepId} completed:`, stepData)
    },
    onError: (error) => {
      console.error('Flow error:', error)
      toast.error(error.message || 'An error occurred')
    },
  })

  useEffect(() => {
    persistedOnboardingFlow
      .hydrate()
      .then((savedState: unknown) => {
        if (savedState) {
          console.log('Restored from saved state', savedState)
        }
        setIsHydrated(true)
      })
      .catch((error: unknown) => {
        console.error('Failed to hydrate:', error)
        setIsHydrated(true)
      })
  }, [])

  // Persist state whenever it changes
  useEffect(() => {
    if (isHydrated && flowContext.state.status !== 'validating') {
      persistedOnboardingFlow.persist(flowContext.state).catch((error: unknown) => {
        console.error('Failed to persist state:', error)
      })
    }
  }, [flowContext.state, isHydrated])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center to-muted">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-lg">Loading your onboarding...</span>
        </div>
      </div>
    )
  }

  return (
    <FormFlowProvider value={flowContext}>
      <Toaster position="top-center" richColors />
      <OnboardingLayout />
    </FormFlowProvider>
  )
}
