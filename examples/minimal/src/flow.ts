import { createFormFlow } from '@creativoma/formachine/core'
import { z } from 'zod'

/**
 * This is the simplest possible FormMachine flow.
 * It has 3 linear steps with no branching or persistence.
 */

// Step 1: Collect name
const nameSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
})

// Step 2: Collect email
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

// Step 3: Confirm
const confirmSchema = z.object({
  agreeToTerms: z.boolean().refine((val: boolean) => val === true, {
    message: 'You must agree to the terms',
  }),
})

// Create the flow definition
export const minimalFlow = createFormFlow({
  id: 'minimal-example',
  steps: {
    name: {
      schema: nameSchema,
      next: 'email', // Go to 'email' step after this one
    },
    email: {
      schema: emailSchema,
      next: 'confirm', // Go to 'confirm' step after this one
    },
    confirm: {
      schema: confirmSchema,
      next: null, // null means this is the final step
    },
  },
  initial: 'name', // Start with the 'name' step
})
