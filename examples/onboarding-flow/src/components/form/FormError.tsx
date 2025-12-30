import { AlertCircle } from 'lucide-react'

interface FormErrorProps {
  error?: { message?: string }
}

export function FormError({ error }: FormErrorProps) {
  if (!error) return null

  const message = typeof error.message === 'string' ? error.message : 'This field has an error'

  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="size-4" />
      {message}
    </p>
  )
}
