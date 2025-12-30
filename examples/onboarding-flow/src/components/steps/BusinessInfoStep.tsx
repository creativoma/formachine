import { useFormFlowContext } from '@formachine/react'
import { Building, FileText, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { FormField } from '../form/FormField'
import { StepCard } from '../layout/StepCard'

export function BusinessInfoStep() {
  const { form } = useFormFlowContext()

  return (
    <StepCard
      icon={<Building className="size-6" />}
      title="Business Information"
      description="Tell us about your business"
    >
      <div className="space-y-6">
        <FormField
          label="Company Name"
          htmlFor="companyName"
          error={form.formState.errors.companyName}
          required
          icon={<Building className="size-4" />}
        >
          <Input
            id="companyName"
            placeholder="Acme Inc."
            autoFocus
            {...form.register('companyName')}
          />
        </FormField>

        <FormField
          label="Tax ID"
          htmlFor="taxId"
          error={form.formState.errors.taxId}
          required
          icon={<FileText className="size-4" />}
        >
          <Input id="taxId" placeholder="12-3456789" {...form.register('taxId')} />
        </FormField>

        <FormField
          label="Business Email"
          htmlFor="email"
          error={form.formState.errors.email}
          required
          icon={<Mail className="size-4" />}
        >
          <Input
            id="email"
            type="email"
            placeholder="business@acme.com"
            {...form.register('email')}
          />
        </FormField>
      </div>
    </StepCard>
  )
}
