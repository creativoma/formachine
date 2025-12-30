import { Check } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { OnboardingStepId } from '@/types/onboarding'

interface ProgressHeaderProps {
  currentStep: OnboardingStepId
  path: OnboardingStepId[]
  completedSteps: Set<OnboardingStepId>
}

const stepLabels: Record<OnboardingStepId, string> = {
  welcome: 'Welcome',
  personalInfo: 'Personal Info',
  businessInfo: 'Business Info',
  preferences: 'Preferences',
  complete: 'Complete',
}

export function ProgressHeader({ currentStep, path, completedSteps }: ProgressHeaderProps) {
  const currentStepIndex = path.indexOf(currentStep)
  const totalSteps = path.length
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Company Onboarding
        </h1>
        <div className="text-sm font-medium px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-foreground/80 shadow-sm">
          Step {currentStepIndex + 1} of {totalSteps}
        </div>
      </div>

      <div className="relative">
        <Progress
          value={progressPercentage}
          className="h-3 bg-white/60 backdrop-blur-sm shadow-inner"
        />
      </div>

      <div className="relative flex items-start justify-between px-1">
        {/* Background line */}
        <div
          className="absolute left-0 right-0 top-5 md:top-6 h-0.5 bg-white/40"
          style={{
            marginLeft: `calc(50% / ${path.length})`,
            marginRight: `calc(50% / ${path.length})`,
          }}
        />

        {path.map((step, index) => {
          const isCompleted = completedSteps.has(step)
          const isCurrent = step === currentStep

          return (
            <div key={step} className="flex flex-col items-center gap-2 flex-1 relative z-10">
              <div
                className={cn(
                  'size-10 md:size-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-lg',
                  isCompleted
                    ? 'bg-primary text-white shadow-primary/30'
                    : isCurrent
                      ? 'bg-white text-primary ring-4 ring-primary/20 shadow-primary/20'
                      : 'bg-white/80 text-muted-foreground/60 shadow-sm'
                )}
              >
                {isCompleted ? <Check className="size-5 md:size-6" /> : index + 1}
              </div>

              {/* Progress line segment */}
              {index < path.length - 1 && (
                <div
                  className="absolute left-1/2 top-5 md:top-6 h-0.5 w-full"
                  style={{ zIndex: -1 }}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isCompleted ? 'bg-linear-to-r from-primary to-primary/80' : 'bg-transparent'
                    )}
                  />
                </div>
              )}

              <span
                className={cn(
                  'text-xs md:text-sm text-center transition-all duration-200 whitespace-nowrap',
                  isCurrent ? 'font-bold text-foreground' : 'font-medium text-muted-foreground/70'
                )}
              >
                {stepLabels[step]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
