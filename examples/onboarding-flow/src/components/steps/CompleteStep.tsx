import { useFormFlowContext } from '@creativoma/formachine'
import { CheckCircle } from 'lucide-react'
import type { FieldError } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FormError } from '../form/FormError'
import { StepCard } from '../layout/StepCard'

export function CompleteStep() {
  const { form, getData } = useFormFlowContext()

  const welcomeData = getData('welcome') as { userType: string } | undefined
  const personalData = getData('personalInfo') as
    | { firstName: string; lastName: string; email: string }
    | undefined
  const businessData = getData('businessInfo') as
    | { companyName: string; taxId: string; email: string }
    | undefined
  const preferencesData = getData('preferences') as
    | { notifications: boolean; newsletter: boolean; theme: string }
    | undefined

  return (
    <StepCard
      icon={<CheckCircle className="size-6" />}
      title="Almost Done!"
      description="Review your information and accept our terms to complete your onboarding"
    >
      <div className="space-y-6">
        <div className="bg-linear-to-br from-gray-50 to-white rounded-xl border border-border/50 p-6">
          <h3 className="font-bold text-lg mb-4 text-foreground">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/30">
              <span className="text-sm text-muted-foreground">Account Type:</span>
              <span className="font-semibold text-sm capitalize">{welcomeData?.userType}</span>
            </div>

            {personalData && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-semibold text-sm">
                    {personalData.firstName} {personalData.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-semibold text-sm">{personalData.email}</span>
                </div>
              </>
            )}

            {businessData && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Company:</span>
                  <span className="font-semibold text-sm">{businessData.companyName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Tax ID:</span>
                  <span className="font-semibold text-sm">{businessData.taxId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-semibold text-sm">{businessData.email}</span>
                </div>
              </>
            )}

            {preferencesData && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Notifications:</span>
                  <span className="font-semibold text-sm">
                    {preferencesData.notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-sm text-muted-foreground">Newsletter:</span>
                  <span className="font-semibold text-sm">
                    {preferencesData.newsletter ? 'Subscribed' : 'Not subscribed'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Theme:</span>
                  <span className="font-semibold text-sm capitalize">{preferencesData.theme}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-white hover:border-primary/40 transition-colors">
          <div className="flex items-start gap-4">
            <Checkbox
              id="acceptTerms"
              checked={form.watch('acceptTerms')}
              onCheckedChange={(checked) => form.setValue('acceptTerms', checked as true)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="acceptTerms" className="cursor-pointer text-base leading-relaxed">
                I accept the{' '}
                <a href="/terms" className="text-primary font-semibold hover:underline">
                  Terms and Conditions
                </a>
              </Label>
            </div>
          </div>
        </div>

        <FormError error={form.formState.errors.acceptTerms as FieldError | undefined} />
      </div>
    </StepCard>
  )
}
