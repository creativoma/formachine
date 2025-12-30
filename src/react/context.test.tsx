import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useFormFlowContext } from './context'

describe('FormFlowContext', () => {
  describe('useFormFlowContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test as we expect an error
      const originalError = console.error
      console.error = () => {}

      expect(() => {
        renderHook(() => useFormFlowContext())
      }).toThrow('useFormFlowContext must be used within a FormFlowProvider')

      // Restore console.error
      console.error = originalError
    })
  })
})
