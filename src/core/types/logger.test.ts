import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { defaultLogger, silentLogger } from './logger'

describe('logger', () => {
  describe('defaultLogger', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    describe('warn', () => {
      it('should log warning in development mode', () => {
        process.env.NODE_ENV = 'development'

        defaultLogger.warn('test warning')

        expect(consoleWarnSpy).toHaveBeenCalledWith('test warning', '')
      })

      it('should log warning with context in development mode', () => {
        process.env.NODE_ENV = 'development'

        const context = { foo: 'bar' }
        defaultLogger.warn('test warning', context)

        expect(consoleWarnSpy).toHaveBeenCalledWith('test warning', context)
      })

      it('should not log warning in production mode', () => {
        process.env.NODE_ENV = 'production'

        defaultLogger.warn('test warning')

        expect(consoleWarnSpy).not.toHaveBeenCalled()
      })
    })

    describe('error', () => {
      it('should always log errors', () => {
        process.env.NODE_ENV = 'production'

        defaultLogger.error('test error')

        expect(consoleErrorSpy).toHaveBeenCalledWith('test error', '')
      })

      it('should log errors with context', () => {
        const context = { error: 'details' }
        defaultLogger.error('test error', context)

        expect(consoleErrorSpy).toHaveBeenCalledWith('test error', context)
      })

      it('should log errors in development mode', () => {
        process.env.NODE_ENV = 'development'

        defaultLogger.error('test error')

        expect(consoleErrorSpy).toHaveBeenCalledWith('test error', '')
      })
    })
  })

  describe('silentLogger', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it('should not log warnings', () => {
      silentLogger.warn('test warning')

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should not log warnings with context', () => {
      silentLogger.warn('test warning', { foo: 'bar' })

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should not log errors', () => {
      silentLogger.error('test error')

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not log errors with context', () => {
      silentLogger.error('test error', { error: 'details' })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})
