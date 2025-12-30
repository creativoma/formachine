import { useFormFlowContext } from '@creativoma/formachine'
import { Building, Sparkles, User } from 'lucide-react'
import { FormError } from '../form/FormError'
import { RadioCard } from '../form/RadioCard'
import { StepCard } from '../layout/StepCard'

export function WelcomeStep() {
  const { form } = useFormFlowContext()
  const userType = form.watch('userType')

  return (
    <StepCard
      icon={<Sparkles className="size-6" />}
      title="Welcome to FormMachine"
      description="Let's get you started with a personalized onboarding experience"
    >
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Are you signing up as an individual or a business? This will help us customize your
          experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RadioCard
            value="individual"
            label="Individual"
            description="Perfect for personal use and individual projects"
            icon={<User className="size-8" />}
            selected={userType === 'individual'}
            onChange={() => form.setValue('userType', 'individual')}
          />
          <RadioCard
            value="business"
            label="Business"
            description="Great for teams and business accounts"
            icon={<Building className="size-8" />}
            selected={userType === 'business'}
            onChange={() => form.setValue('userType', 'business')}
          />
        </div>

        <FormError error={form.formState.errors.userType} />
      </div>
    </StepCard>
  )
}
