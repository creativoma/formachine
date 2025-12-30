import type { FieldError } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { FormError } from './FormError'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: FieldError
  required?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function FormField({ label, htmlFor, error, required, icon, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      <FormError error={error} />
    </div>
  )
}
