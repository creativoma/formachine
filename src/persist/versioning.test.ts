import { describe, expect, it } from 'vitest'
import { migrateData, wrapWithVersion } from './versioning'

describe('Versioning utilities', () => {
  describe('wrapWithVersion', () => {
    it('should wrap data with version number', () => {
      const data = { foo: 'bar' }
      const version = 1

      const wrapped = wrapWithVersion(data, version)

      expect(wrapped).toEqual({
        version: 1,
        data: { foo: 'bar' },
      })
    })

    it('should work with different data types', () => {
      expect(wrapWithVersion('string', 2)).toEqual({
        version: 2,
        data: 'string',
      })

      expect(wrapWithVersion(123, 3)).toEqual({
        version: 3,
        data: 123,
      })

      expect(wrapWithVersion(null, 1)).toEqual({
        version: 1,
        data: null,
      })
    })
  })

  describe('migrateData', () => {
    it('should return data when version matches', () => {
      const rawData = {
        version: 1,
        data: { foo: 'bar' },
      }

      const result = migrateData(rawData, 1)

      expect(result).toEqual({ foo: 'bar' })
    })

    it('should return null when rawData is null', () => {
      const result = migrateData(null, 1)
      expect(result).toBeNull()
    })

    it('should return null when rawData is undefined', () => {
      const result = migrateData(undefined, 1)
      expect(result).toBeNull()
    })

    it('should return null when rawData is not an object', () => {
      expect(migrateData('string', 1)).toBeNull()
      expect(migrateData(123, 1)).toBeNull()
      expect(migrateData(true, 1)).toBeNull()
    })

    it('should use migration function when version differs', () => {
      const rawData = {
        version: 0,
        data: { oldField: 'value' },
      }

      const migrate = (oldData: unknown, oldVersion: number) => {
        if (oldVersion === 0) {
          return {
            newField: (oldData as { oldField: string }).oldField,
            version: 1,
          }
        }
        return oldData
      }

      const result = migrateData(rawData, 1, migrate)

      expect(result).toEqual({
        newField: 'value',
        version: 1,
      })
    })

    it('should return null when version differs and no migration provided', () => {
      const rawData = {
        version: 0,
        data: { foo: 'bar' },
      }

      const result = migrateData(rawData, 1)

      expect(result).toBeNull()
    })

    it('should handle multi-version migrations', () => {
      const rawData = {
        version: 0,
        data: { v0field: 'original' },
      }

      const migrate = (oldData: unknown, oldVersion: number) => {
        let data = oldData as Record<string, unknown>

        // Migrate from v0 to v1
        if (oldVersion === 0) {
          data = {
            v1field: (data as { v0field: string }).v0field,
          }
        }

        // Migrate from v1 to v2
        if (oldVersion <= 1) {
          data = {
            ...data,
            v2field: 'new',
          }
        }

        return data
      }

      const result = migrateData(rawData, 2, migrate)

      expect(result).toEqual({
        v1field: 'original',
        v2field: 'new',
      })
    })

    it('should handle migration errors gracefully', () => {
      const rawData = {
        version: 0,
        data: { foo: 'bar' },
      }

      const migrate = () => {
        throw new Error('Migration failed')
      }

      expect(() => migrateData(rawData, 1, migrate)).toThrow('Migration failed')
    })

    it('should preserve type safety with generics', () => {
      interface V2Data {
        firstName: string
        lastName: string
      }

      const rawData = {
        version: 1,
        data: { name: 'John Doe' },
      }

      const migrate = (oldData: unknown, oldVersion: number): V2Data => {
        if (oldVersion === 1) {
          const parts = (oldData as { name: string }).name.split(' ')
          const firstName = parts[0] ?? ''
          const lastName = parts[1] ?? ''
          return { firstName, lastName }
        }
        return oldData as V2Data
      }

      const result = migrateData<V2Data>(rawData, 2, migrate)

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      })
    })
  })
})
