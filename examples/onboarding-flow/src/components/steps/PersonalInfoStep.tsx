import { useFormFlowContext } from '@formachine/react'
import { Mail, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FormField } from '../form/FormField'
import { StepCard } from '../layout/StepCard'

export function PersonalInfoStep() {
  const { form } = useFormFlowContext()

  return (
    <StepCard
      icon={<User className="size-6" />}
      title="Personal Information"
      description="Tell us a bit about yourself"
    >
      <div className="space-y-6">
        <FormField
          label="First Name"
          htmlFor="firstName"
          error={form.formState.errors.firstName}
          required
          icon={<User className="size-4" />}
        >
          <Input id="firstName" placeholder="John" autoFocus {...form.register('firstName')} />
        </FormField>

        <FormField
          label="Last Name"
          htmlFor="lastName"
          error={form.formState.errors.lastName}
          required
          icon={<User className="size-4" />}
        >
          <Input id="lastName" placeholder="Doe" {...form.register('lastName')} />
        </FormField>

        <FormField
          label="Email Address"
          htmlFor="email"
          error={form.formState.errors.email}
          required
          icon={<Mail className="size-4" />}
        >
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...form.register('email')}
          />
        </FormField>
      </div>
    </StepCard>
  )
}
