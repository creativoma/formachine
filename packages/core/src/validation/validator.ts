import type { z } from 'zod'
import { isError, isZodError } from '../utils/type-guards'
import type { ValidationResult } from './step'

/**
 * Generic validator interface that abstracts validation logic.
 * Allows using different validation libraries (Zod, Yup, ArkType, etc.)
 */
export interface Validator<TInput = unknown, TOutput = TInput> {
  /**
   * Parse and validate data, throwing on error
   */
  parse(data: TInput): Promise<TOutput>

  /**
   * Parse and validate data, returning result object
   */
  safeParse(data: TInput): Promise<ValidationResult<TOutput>>

  /**
   * Synchronous parse, if supported
   */
  parseSync?(data: TInput): TOutput

  /**
   * Synchronous safe parse, if supported
   */
  safeParseSync?(data: TInput): ValidationResult<TOutput>
}

/**
 * Adapter to use Zod schemas as validators
 */
export function zodValidator<TSchema extends z.ZodType>(
  schema: TSchema
): Validator<unknown, z.infer<TSchema>> {
  return {
    parse: async (data: unknown) => {
      return schema.parseAsync(data)
    },

    safeParse: async (data: unknown) => {
      const result = await schema.safeParseAsync(data)
      if (result.success) {
        return { success: true, data: result.data }
      }
      return { success: false, errors: result.error }
    },

    parseSync: (data: unknown) => {
      return schema.parse(data)
    },

    safeParseSync: (data: unknown) => {
      const result = schema.safeParse(data)
      if (result.success) {
        return { success: true, data: result.data }
      }
      return { success: false, errors: result.error }
    },
  }
}

/**
 * Create a custom validator from validation functions
 */
export function createValidator<TInput, TOutput = TInput>(options: {
  validate: (data: TInput) => Promise<TOutput> | TOutput
  validateSync?: (data: TInput) => TOutput
}): Validator<TInput, TOutput> {
  return {
    parse: async (data: TInput) => {
      return await options.validate(data)
    },

    safeParse: async (data: TInput) => {
      try {
        const result = await options.validate(data)
        return { success: true, data: result }
      } catch (error) {
        if (isZodError(error)) {
          return { success: false, errors: error }
        }
        // Return generic errors as validation errors
        if (isError(error)) {
          return { success: false, errors: error }
        }
        // Re-throw non-validation errors
        throw error
      }
    },

    parseSync: options.validateSync,

    safeParseSync: options.validateSync
      ? (data: TInput) => {
          try {
            const result = options.validateSync?.(data)
            return { success: true, data: result }
          } catch (error) {
            if (isZodError(error)) {
              return { success: false, errors: error }
            }
            // Return generic errors as validation errors
            if (isError(error)) {
              return { success: false, errors: error }
            }
            // Re-throw non-validation errors
            throw error
          }
        }
      : undefined,
  }
}
