# API Reference

This directory contains the complete API documentation for all formachine packages.

## Packages

- [Core API](./core.md) - Flow definition, state machine, and types
- [React API](./react.md) - React hooks and components
- [Persist API](./persist.md) - Persistence adapters and utilities

## Quick Links

### Core Types

```typescript
import type {
  FlowDefinition,
  StepDefinition,
  FlowState,
  InferStepIds,
  InferFlowData,
} from '@formachine/core'
```

### React Hooks

```typescript
import {
  useFormFlow,
  useNavigation,
  usePath,
  useStep,
  usePreloadNext,
} from '@formachine/react'
```

### Components

```typescript
import {
  FormFlowProvider,
  Step,
  Guard,
  StepErrorBoundary,
} from '@formachine/react'
```

### Persistence

```typescript
import { withPersistence } from '@formachine/persist'
import { localStorageAdapter, sessionStorageAdapter } from '@formachine/persist/adapters'
```
