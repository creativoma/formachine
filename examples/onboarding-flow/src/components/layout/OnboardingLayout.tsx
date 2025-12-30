import { Step, useFormFlowContext } from '@formachine/react'
import type { OnboardingStepId } from '@/types/onboarding'
import { BusinessInfoStep } from '../steps/BusinessInfoStep'
import { CompleteStep } from '../steps/CompleteStep'
import { PersonalInfoStep } from '../steps/PersonalInfoStep'
import { PreferencesStep } from '../steps/PreferencesStep'
import { WelcomeStep } from '../steps/WelcomeStep'
import { NavigationFooter } from './NavigationFooter'
import { ProgressHeader } from './ProgressHeader'

export function OnboardingLayout() {
  const {
    currentStep,
    path,
    completedSteps,
    canGoBack,
    canGoNext,
    isSubmitting,
    isComplete,
    back,
    reset,
    next,
  } = useFormFlowContext()

  return (
    <div className="min-h-screen flex items-center">
      <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-10">
        <ProgressHeader
          currentStep={currentStep as OnboardingStepId}
          path={path as OnboardingStepId[]}
          completedSteps={completedSteps as Set<OnboardingStepId>}
        />

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Step name="welcome">{() => <WelcomeStep />}</Step>
          <Step name="personalInfo">{() => <PersonalInfoStep />}</Step>
          <Step name="businessInfo">{() => <BusinessInfoStep />}</Step>
          <Step name="preferences">{() => <PreferencesStep />}</Step>
          <Step name="complete">{() => <CompleteStep />}</Step>
        </div>

        <NavigationFooter
          canGoBack={canGoBack}
          canGoNext={canGoNext}
          isSubmitting={isSubmitting}
          isComplete={isComplete}
          onBack={back}
          onReset={reset}
          onNext={next}
        />
      </div>
    </div>
  )
}
