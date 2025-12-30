export type WelcomeStepData = {
  userType: 'individual' | 'business'
}

export type PersonalInfoStepData = {
  firstName: string
  lastName: string
  email: string
}

export type BusinessInfoStepData = {
  companyName: string
  taxId: string
  email: string
}

export type PreferencesStepData = {
  notifications: boolean
  newsletter: boolean
  theme: 'light' | 'dark' | 'auto'
}

export type CompleteStepData = {
  acceptTerms: true
}

export type OnboardingStepId =
  | 'welcome'
  | 'personalInfo'
  | 'businessInfo'
  | 'preferences'
  | 'complete'
