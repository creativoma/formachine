/**
 * Enum of error codes for FormFlow errors
 */
export enum FormFlowErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_STEP = 'INVALID_STEP',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  MISSING_DATA = 'MISSING_DATA',
  FLOW_DEFINITION_INVALID = 'FLOW_DEFINITION_INVALID',
  ASYNC_VALIDATION_CANCELLED = 'ASYNC_VALIDATION_CANCELLED',
  STEP_NOT_COMPLETED = 'STEP_NOT_COMPLETED',
  NAVIGATION_BLOCKED = 'NAVIGATION_BLOCKED',
}

// V8-specific Error interface extension
interface ErrorConstructor {
  // biome-ignore lint/complexity/noBannedTypes: V8's captureStackTrace accepts any constructor function
  captureStackTrace?(targetObject: object, constructorOpt?: Function): void
}

/**
 * Custom error class for FormFlow errors
 * Provides structured error information with codes and suggestions
 */
export class FormFlowError extends Error {
  constructor(
    public code: FormFlowErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public suggestions?: string[]
  ) {
    super(message)
    this.name = 'FormFlowError'

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    const ErrorConstructor = Error as ErrorConstructor
    if (typeof ErrorConstructor.captureStackTrace === 'function') {
      ErrorConstructor.captureStackTrace(this, FormFlowError)
    }
  }

  /**
   * Serialize error to JSON for logging or transmission
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      suggestions: this.suggestions,
      stack: this.stack,
    }
  }

  /**
   * Format error as a detailed string
   */
  override toString(): string {
    let str = `${this.name} [${this.code}]: ${this.message}`

    if (this.details && Object.keys(this.details).length > 0) {
      str += `\nDetails: ${JSON.stringify(this.details, null, 2)}`
    }

    if (this.suggestions && this.suggestions.length > 0) {
      str += `\n\nSuggestions:\n${this.suggestions.map((s) => `  - ${s}`).join('\n')}`
    }

    return str
  }
}

/**
 * Create a validation error
 */
export function createValidationError(
  step: string,
  errors: unknown,
  suggestions?: string[]
): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.VALIDATION_FAILED,
    `Validation failed for step "${step}"`,
    { step, errors },
    suggestions || [
      'Check that all required fields are filled',
      'Verify that data types match the schema',
      'Review validation rules for this step',
    ]
  )
}

/**
 * Create an invalid step error
 */
export function createInvalidStepError(step: string, availableSteps: string[]): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.INVALID_STEP,
    `Step "${step}" does not exist in flow definition`,
    { step, availableSteps },
    [
      `Available steps: ${availableSteps.join(', ')}`,
      'Check the flow definition for typos',
      'Ensure the step name matches exactly (case-sensitive)',
    ]
  )
}

/**
 * Create an invalid transition error
 */
export function createInvalidTransitionError(
  from: string,
  to: string,
  reason: string
): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.INVALID_TRANSITION,
    `Cannot transition from "${from}" to "${to}": ${reason}`,
    { from, to, reason },
    [
      'Ensure the current step is completed before moving forward',
      'Check that the target step is accessible from the current step',
      'Review the flow definition for valid transitions',
    ]
  )
}

/**
 * Create a missing data error
 */
export function createMissingDataError(step: string, requiredFields?: string[]): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.MISSING_DATA,
    `Required data is missing for step "${step}"`,
    { step, requiredFields },
    [
      'Complete the current step before proceeding',
      requiredFields
        ? `Required fields: ${requiredFields.join(', ')}`
        : 'Fill in all required fields',
      'Use setStepData() to provide the necessary data',
    ]
  )
}

/**
 * Create a flow definition invalid error
 */
export function createFlowDefinitionError(
  message: string,
  validationErrors: Array<{ type: string; message: string; step?: string }>
): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.FLOW_DEFINITION_INVALID,
    message,
    { validationErrors },
    [
      'Review the flow definition structure',
      'Ensure all steps have valid schemas',
      'Check that all next step references are correct',
      'Use validateFlowDefinition() to identify specific issues',
    ]
  )
}

/**
 * Create an async validation cancelled error
 */
export function createAsyncValidationCancelledError(step: string, reason?: string): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.ASYNC_VALIDATION_CANCELLED,
    `Async validation for step "${step}" was cancelled${reason ? `: ${reason}` : ''}`,
    { step, reason },
    [
      'This usually happens when a new validation is started before the previous one completes',
      'Consider using debouncing for user input',
      'Check if the validation should be retriable',
    ]
  )
}

/**
 * Create a step not completed error
 */
export function createStepNotCompletedError(step: string, action: string): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.STEP_NOT_COMPLETED,
    `Cannot ${action}: step "${step}" is not completed`,
    { step, action },
    [
      `Complete step "${step}" before attempting to ${action}`,
      'Provide valid data for all required fields',
      'Ensure all validation rules pass',
    ]
  )
}

/**
 * Create a navigation blocked error
 */
export function createNavigationBlockedError(
  from: string,
  to: string,
  reason: string
): FormFlowError {
  return new FormFlowError(
    FormFlowErrorCode.NAVIGATION_BLOCKED,
    `Navigation from "${from}" to "${to}" is blocked: ${reason}`,
    { from, to, reason },
    [
      'Check navigation guards or middleware',
      'Ensure all prerequisites are met',
      'Review the flow logic for conditional navigation',
    ]
  )
}

/**
 * Type guard to check if an error is a FormFlowError
 */
export function isFormFlowError(error: unknown): error is FormFlowError {
  return error instanceof FormFlowError
}
