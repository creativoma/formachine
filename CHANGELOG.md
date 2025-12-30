# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-29

### 🎉 Initial Release

First release of FormMachine - a type-safe, declarative multi-step form library for React.

#### Core Features (`@formachine/core`)

**Added**
- `createFormFlow()` - Factory for creating type-safe form flows with declarative step definitions
- **State Machine** - Robust state machine implementation for managing form flow
  - Automatic path calculation based on conditional transitions
  - Path recalculation when earlier data changes
  - Support for computed next steps using resolver functions
- **Validation System**
  - Synchronous validation with Zod schemas
  - Async validation with debouncing, caching, and retry logic
  - Per-step validation with full type inference
- **Type Safety**
  - Full TypeScript inference from Zod schemas
  - Automatic type narrowing based on current flow path
  - Zero type assertions required in user code
- **Conditional Branching**
  - Dynamic next step resolution based on form data
  - Support for complex branching logic
  - Type-safe transition guards

#### React Integration (`@formachine/react`)

**Added**
- **Hooks**
  - `useFormFlow()` - Main hook for flow management with React Hook Form integration
  - `useNavigation()` - Navigation controls (next, back, goto) with validation
  - `useStep()` - Access current step data and metadata
  - `usePath()` - Path information (completion, remaining steps, progress)
  - `usePreloadNext()` - Preload and prepare next step for improved UX
- **Components**
  - `<Provider>` - Context provider for form flow state
  - `<Step>` - Declarative step rendering with automatic show/hide
  - `<Guard>` - Navigation guards to prevent accessing incomplete steps
  - `<StepErrorBoundary>` - Error boundary for step-level error handling
- **Features**
  - Automatic form data synchronization
  - Validation state management
  - Navigation constraints enforcement
  - Step transition animations support

#### Persistence (`@formachine/persist`)

**Added**
- **Adapters**
  - localStorage adapter with automatic serialization
  - sessionStorage adapter for temporary persistence
  - Custom adapter support with type-safe interface
- **Features**
  - TTL (Time-To-Live) support with automatic expiration
  - Version-based data migrations
  - Automatic state hydration and dehydration
  - `withPersistence()` HOC for adding persistence to any flow

#### Developer Experience

**Added**
- Comprehensive TypeScript support (TypeScript 5.9)
- Full test coverage (168 tests) using Vitest
- Monorepo structure with pnpm workspaces
- Biome for linting and formatting
- Example onboarding flow application
- Complete API documentation

#### Documentation

**Added**
- README with quick start guide and examples
- Complete API documentation for all packages
- Migration guide
- Contributing guide
- Detailed specification document
- Example project demonstrating real-world usage