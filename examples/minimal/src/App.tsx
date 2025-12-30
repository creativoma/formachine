import type { InferFlowData } from '@formachine/core'
import { FormFlowProvider, useFormFlow } from '@formachine/react'
import { useState } from 'react'
import { minimalFlow } from './flow'
import './App.css'

type FlowData = InferFlowData<typeof minimalFlow.definition>

function MinimalForm() {
  const flow = useFormFlow(minimalFlow, {
    onComplete: (data) => {
      console.log('Form completed!', data)
      setCompletedData(data as FlowData)
    },
  })

  const [completedData, setCompletedData] = useState<FlowData | null>(null)

  if (completedData) {
    return (
      <div className="container">
        <div className="card success">
          <h1>✅ Complete!</h1>
          <p>You've successfully completed all steps.</p>

          <div className="data-display">
            <h3>Your Information:</h3>
            <pre>{JSON.stringify(completedData, null, 2)}</pre>
          </div>

          <button
            type="button"
            onClick={() => {
              setCompletedData(null)
              flow.reset()
            }}
            className="button button-primary"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <FormFlowProvider value={flow}>
      <div className="container">
        <div className="card">
          {/* Progress indicator */}
          <div className="progress">
            Step {flow.currentStep === 'name' ? '1' : flow.currentStep === 'email' ? '2' : '3'} of 3
          </div>

          {/* Step 1: Name */}
          {flow.currentStep === 'name' && (
            <div className="step">
              <h2>What's your name?</h2>

              <div className="field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  {...flow.form.register('firstName')}
                  className={flow.form.formState.errors.firstName ? 'error' : ''}
                />
                {flow.form.formState.errors.firstName && (
                  <span className="error-message">
                    {flow.form.formState.errors.firstName.message as string}
                  </span>
                )}
              </div>

              <div className="field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  {...flow.form.register('lastName')}
                  className={flow.form.formState.errors.lastName ? 'error' : ''}
                />
                {flow.form.formState.errors.lastName && (
                  <span className="error-message">
                    {flow.form.formState.errors.lastName.message as string}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Email */}
          {flow.currentStep === 'email' && (
            <div className="step">
              <h2>What's your email?</h2>

              <div className="field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  {...flow.form.register('email')}
                  className={flow.form.formState.errors.email ? 'error' : ''}
                />
                {flow.form.formState.errors.email && (
                  <span className="error-message">
                    {flow.form.formState.errors.email.message as string}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {flow.currentStep === 'confirm' && (
            <div className="step">
              <h2>Almost done!</h2>

              <div className="checkbox-field">
                <input id="agreeToTerms" type="checkbox" {...flow.form.register('agreeToTerms')} />
                <label htmlFor="agreeToTerms">I agree to the terms and conditions</label>
              </div>
              {flow.form.formState.errors.agreeToTerms && (
                <span className="error-message">
                  {flow.form.formState.errors.agreeToTerms.message as string}
                </span>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="actions">
            {flow.canGoBack && (
              <button type="button" onClick={flow.back} className="button button-secondary">
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={flow.next}
              disabled={flow.isSubmitting}
              className="button button-primary"
            >
              {flow.currentStep === 'confirm' ? 'Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </FormFlowProvider>
  )
}

export default MinimalForm
