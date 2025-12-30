import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { FlowDefinition } from '../types/flow'
import { calculateFullPath, calculatePath } from './path'

describe('calculatePath', () => {
  const linearFlow = {
    id: 'linear',
    steps: {
      step1: {
        schema: z.object({ name: z.string() }),
        next: 'step2',
      },
      step2: {
        schema: z.object({ email: z.string() }),
        next: 'step3',
      },
      step3: {
        schema: z.object({ done: z.boolean() }),
        next: null,
      },
    },
    initial: 'step1',
  }

  it('should return only initial step with no data', () => {
    const path = calculatePath(linearFlow, {})
    expect(path).toEqual(['step1'])
  })

  it('should calculate path based on completed steps', () => {
    const path = calculatePath(linearFlow, {
      step1: { name: 'John' },
    })
    expect(path).toEqual(['step1', 'step2'])
  })

  it('should calculate full path with all data', () => {
    const path = calculatePath(linearFlow, {
      step1: { name: 'John' },
      step2: { email: 'john@example.com' },
      step3: { done: true },
    })
    expect(path).toEqual(['step1', 'step2', 'step3'])
  })

  describe('with branching', () => {
    const branchingFlow = {
      id: 'branching',
      steps: {
        start: {
          schema: z.object({ type: z.enum(['a', 'b']) }),
          next: (data: { type: 'a' | 'b' }) => (data.type === 'a' ? 'branchA' : 'branchB'),
        },
        branchA: {
          schema: z.object({ valueA: z.string() }),
          next: 'end',
        },
        branchB: {
          schema: z.object({ valueB: z.string() }),
          next: 'end',
        },
        end: {
          schema: z.object({ confirmed: z.boolean() }),
          next: null,
        },
      },
      initial: 'start',
    } as const satisfies FlowDefinition<any>

    it('should follow branch A', () => {
      const path = calculatePath(branchingFlow, {
        start: { type: 'a' },
      })
      expect(path).toEqual(['start', 'branchA'])
    })

    it('should follow branch B', () => {
      const path = calculatePath(branchingFlow, {
        start: { type: 'b' },
      })
      expect(path).toEqual(['start', 'branchB'])
    })

    it('should complete full branch A path', () => {
      const path = calculatePath(branchingFlow, {
        start: { type: 'a' },
        branchA: { valueA: 'test' },
        end: { confirmed: true },
      })
      expect(path).toEqual(['start', 'branchA', 'end'])
    })
  })
})

describe('calculateFullPath', () => {
  const staticFlow = {
    id: 'test',
    steps: {
      a: { schema: z.object({ x: z.string() }), next: 'b' },
      b: { schema: z.object({ y: z.string() }), next: null },
    },
    initial: 'a',
  }

  const dynamicFlow = {
    id: 'dynamic',
    steps: {
      a: {
        schema: z.object({ x: z.string() }),
        next: (data: { x: string }) => (data.x === 'yes' ? 'b' : null),
      },
      b: { schema: z.object({ y: z.string() }), next: null },
    },
    initial: 'a',
  } as const satisfies FlowDefinition<any>

  it('should follow static transitions even without data', () => {
    const path = calculateFullPath(staticFlow, {})
    expect(path).toEqual(['a', 'b'])
  })

  it('should stop at step without data for transition function', () => {
    const path = calculateFullPath(dynamicFlow, {})
    expect(path).toEqual(['a'])
  })

  it('should follow static transitions with data', () => {
    const path = calculateFullPath(staticFlow, { a: { x: 'test' } })
    expect(path).toEqual(['a', 'b'])
  })

  it('should follow transition function with data', () => {
    const path = calculateFullPath(dynamicFlow, { a: { x: 'yes' } })
    expect(path).toEqual(['a', 'b'])
  })
})
