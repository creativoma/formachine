import { createFormFlow } from '@creativoma/formachine/core'
import { localStorage, withPersistence } from '@creativoma/formachine/persist'
import { z } from 'zod'

export const onboardingFlowDefinition = createFormFlow({
  id: 'user-onboarding',
  steps: {
    welcome: {
      schema: z.object({
        userType: z.enum(['individual', 'business']),
      }),
      next: (data: { userType: 'individual' | 'business' }) =>
        data.userType === 'individual' ? 'personalInfo' : 'businessInfo',
    },
    personalInfo: {
      schema: z.object({
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        email: z.email('Invalid email address'),
      }),
      next: 'preferences',
    },
    businessInfo: {
      schema: z.object({
        companyName: z.string().min(2, 'Company name is required'),
        taxId: z.string().min(9, 'Valid tax ID required'),
        email: z.email('Invalid email address'),
      }),
      next: 'preferences',
    },
    preferences: {
      schema: z.object({
        notifications: z.boolean().default(false),
        newsletter: z.boolean().default(false),
        theme: z.enum(['light', 'dark', 'auto']).default('auto'),
      }),
      next: 'complete',
    },
    complete: {
      schema: z.object({
        acceptTerms: z.literal(true, {
          message: 'You must accept the terms',
        }),
      }),
      next: null,
    },
  },
  initial: 'welcome',
})

export const persistedOnboardingFlow = withPersistence(onboardingFlowDefinition, {
  adapter: localStorage,
  key: 'onboarding-state',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  version: 1,
})
