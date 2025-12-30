import type { z } from 'zod'

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
}

export async function validateStep<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown
): Promise<ValidationResult<z.infer<TSchema>>> {
  const result = await schema.safeParseAsync(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}

export function validateStepSync<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown
): ValidationResult<z.infer<TSchema>> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error }
}
