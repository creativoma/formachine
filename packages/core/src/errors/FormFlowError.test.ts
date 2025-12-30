import { describe, expect, it } from 'vitest'
import {
  createAsyncValidationCancelledError,
  createFlowDefinitionError,
  createInvalidStepError,
  createInvalidTransitionError,
  createMissingDataError,
  createNavigationBlockedError,
  createStepNotCompletedError,
  createValidationError,
  FormFlowError,
  FormFlowErrorCode,
  isFormFlowError,
} from './FormFlowError'

describe('FormFlowError', () => {
  describe('constructor', () => {
    it('should create error with basic properties', () => {
      const error = new FormFlowError(FormFlowErrorCode.VALIDATION_FAILED, 'Test error')

      expect(error.code).toBe(FormFlowErrorCode.VALIDATION_FAILED)
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('FormFlowError')
      expect(error.details).toBeUndefined()
      expect(error.suggestions).toBeUndefined()
    })

    it('should create error with details and suggestions', () => {
      const details = { step: 'test', value: 123 }
      const suggestions = ['Fix this', 'Try that']

      const error = new FormFlowError(
        FormFlowErrorCode.INVALID_STEP,
        'Test error',
        details,
        suggestions
      )

      expect(error.details).toEqual(details)
      expect(error.suggestions).toEqual(suggestions)
    })

    it('should be instanceof Error', () => {
      const error = new FormFlowError(FormFlowErrorCode.VALIDATION_FAILED, 'Test')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(FormFlowError)
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new FormFlowError(
        FormFlowErrorCode.VALIDATION_FAILED,
        'Test error',
        { step: 'test' },
        ['Suggestion 1']
      )

      const json = error.toJSON()

      expect(json).toEqual({
        name: 'FormFlowError',
        code: FormFlowErrorCode.VALIDATION_FAILED,
        message: 'Test error',
        details: { step: 'test' },
        suggestions: ['Suggestion 1'],
        stack: expect.any(String),
      })
    })
  })

  describe('toString', () => {
    it('should format basic error', () => {
      const error = new FormFlowError(FormFlowErrorCode.VALIDATION_FAILED, 'Test error')

      const str = error.toString()

      expect(str).toContain('FormFlowError')
      expect(str).toContain('VALIDATION_FAILED')
      expect(str).toContain('Test error')
    })

    it('should include details in formatted string', () => {
      const error = new FormFlowError(FormFlowErrorCode.INVALID_STEP, 'Test error', {
        step: 'test',
        extra: 'info',
      })

      const str = error.toString()

      expect(str).toContain('Details:')
      expect(str).toContain('step')
      expect(str).toContain('test')
    })

    it('should include suggestions in formatted string', () => {
      const error = new FormFlowError(
        FormFlowErrorCode.VALIDATION_FAILED,
        'Test error',
        undefined,
        ['First suggestion', 'Second suggestion']
      )

      const str = error.toString()

      expect(str).toContain('Suggestions:')
      expect(str).toContain('First suggestion')
      expect(str).toContain('Second suggestion')
    })
  })
})

describe('createValidationError', () => {
  it('should create validation error with defaults', () => {
    const error = createValidationError('step1', { field: 'invalid' })

    expect(error.code).toBe(FormFlowErrorCode.VALIDATION_FAILED)
    expect(error.message).toContain('step1')
    expect(error.details).toEqual({ step: 'step1', errors: { field: 'invalid' } })
    expect(error.suggestions).toBeDefined()
    expect(error.suggestions?.length).toBeGreaterThan(0)
  })
  it('should use custom suggestions when provided', () => {
    const customSuggestions = ['Custom suggestion 1', 'Custom suggestion 2']
    const error = createValidationError('step1', {}, customSuggestions)

    expect(error.suggestions).toEqual(customSuggestions)
  })
})

describe('createInvalidStepError', () => {
  it('should create invalid step error', () => {
    const error = createInvalidStepError('invalidStep', ['step1', 'step2'])

    expect(error.code).toBe(FormFlowErrorCode.INVALID_STEP)
    expect(error.message).toContain('invalidStep')
    expect(error.details?.step).toBe('invalidStep')
    expect(error.details?.availableSteps).toEqual(['step1', 'step2'])
    expect(error.suggestions?.[0]).toContain('step1, step2')
  })
})

describe('createInvalidTransitionError', () => {
  it('should create invalid transition error', () => {
    const error = createInvalidTransitionError('step1', 'step2', 'Not completed')

    expect(error.code).toBe(FormFlowErrorCode.INVALID_TRANSITION)
    expect(error.message).toContain('step1')
    expect(error.message).toContain('step2')
    expect(error.message).toContain('Not completed')
    expect(error.details).toEqual({
      from: 'step1',
      to: 'step2',
      reason: 'Not completed',
    })
  })
})

describe('createMissingDataError', () => {
  it('should create missing data error without required fields', () => {
    const error = createMissingDataError('step1')

    expect(error.code).toBe(FormFlowErrorCode.MISSING_DATA)
    expect(error.message).toContain('step1')
    expect(error.details?.step).toBe('step1')
  })

  it('should include required fields when provided', () => {
    const error = createMissingDataError('step1', ['email', 'name'])

    expect(error.details?.requiredFields).toEqual(['email', 'name'])
    expect(error.suggestions?.some((s) => s.includes('email, name'))).toBe(true)
  })
})

describe('createFlowDefinitionError', () => {
  it('should create flow definition error', () => {
    const validationErrors = [
      { type: 'missing_step', message: 'Step not found', step: 'step1' },
      { type: 'invalid_next', message: 'Invalid next', step: 'step2' },
    ]

    const error = createFlowDefinitionError('Invalid flow', validationErrors)

    expect(error.code).toBe(FormFlowErrorCode.FLOW_DEFINITION_INVALID)
    expect(error.message).toBe('Invalid flow')
    expect(error.details?.validationErrors).toEqual(validationErrors)
    expect(error.suggestions).toBeDefined()
  })
})

describe('createAsyncValidationCancelledError', () => {
  it('should create async validation cancelled error without reason', () => {
    const error = createAsyncValidationCancelledError('step1')

    expect(error.code).toBe(FormFlowErrorCode.ASYNC_VALIDATION_CANCELLED)
    expect(error.message).toContain('step1')
    expect(error.details?.step).toBe('step1')
  })

  it('should include reason when provided', () => {
    const error = createAsyncValidationCancelledError('step1', 'User navigated away')

    expect(error.message).toContain('User navigated away')
    expect(error.details?.reason).toBe('User navigated away')
  })
})

describe('createStepNotCompletedError', () => {
  it('should create step not completed error', () => {
    const error = createStepNotCompletedError('step1', 'proceed to next step')

    expect(error.code).toBe(FormFlowErrorCode.STEP_NOT_COMPLETED)
    expect(error.message).toContain('step1')
    expect(error.message).toContain('proceed to next step')
    expect(error.details).toEqual({
      step: 'step1',
      action: 'proceed to next step',
    })
  })
})

describe('createNavigationBlockedError', () => {
  it('should create navigation blocked error', () => {
    const error = createNavigationBlockedError('step1', 'step2', 'Guard condition failed')

    expect(error.code).toBe(FormFlowErrorCode.NAVIGATION_BLOCKED)
    expect(error.message).toContain('step1')
    expect(error.message).toContain('step2')
    expect(error.message).toContain('Guard condition failed')
    expect(error.details).toEqual({
      from: 'step1',
      to: 'step2',
      reason: 'Guard condition failed',
    })
  })
})

describe('isFormFlowError', () => {
  it('should return true for FormFlowError instances', () => {
    const error = new FormFlowError(FormFlowErrorCode.VALIDATION_FAILED, 'Test')

    expect(isFormFlowError(error)).toBe(true)
  })

  it('should return false for regular Error', () => {
    const error = new Error('Regular error')

    expect(isFormFlowError(error)).toBe(false)
  })

  it('should return false for non-Error values', () => {
    expect(isFormFlowError('string')).toBe(false)
    expect(isFormFlowError(123)).toBe(false)
    expect(isFormFlowError(null)).toBe(false)
    expect(isFormFlowError(undefined)).toBe(false)
    expect(isFormFlowError({})).toBe(false)
  })

  it('should narrow type correctly', () => {
    const error: unknown = new FormFlowError(FormFlowErrorCode.VALIDATION_FAILED, 'Test')

    if (isFormFlowError(error)) {
      // Type should be narrowed to FormFlowError
      expect(error.code).toBe(FormFlowErrorCode.VALIDATION_FAILED)
      expect(error.details).toBeUndefined()
    }
  })
})

describe('error code enum', () => {
  it('should have all expected error codes', () => {
    expect(FormFlowErrorCode.VALIDATION_FAILED).toBe('VALIDATION_FAILED')
    expect(FormFlowErrorCode.INVALID_STEP).toBe('INVALID_STEP')
    expect(FormFlowErrorCode.INVALID_TRANSITION).toBe('INVALID_TRANSITION')
    expect(FormFlowErrorCode.MISSING_DATA).toBe('MISSING_DATA')
    expect(FormFlowErrorCode.FLOW_DEFINITION_INVALID).toBe('FLOW_DEFINITION_INVALID')
    expect(FormFlowErrorCode.ASYNC_VALIDATION_CANCELLED).toBe('ASYNC_VALIDATION_CANCELLED')
    expect(FormFlowErrorCode.STEP_NOT_COMPLETED).toBe('STEP_NOT_COMPLETED')
    expect(FormFlowErrorCode.NAVIGATION_BLOCKED).toBe('NAVIGATION_BLOCKED')
  })
})
