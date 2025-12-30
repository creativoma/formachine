# Internal Hooks

This directory contains internal hooks used by `useFormFlow`. These hooks are not part of the public API and should not be imported directly by library consumers.

## Overview

The `useFormFlow` hook was refactored to improve code organization, maintainability, and testability by separating concerns into smaller, focused internal hooks.

## Hook Breakdown

### `useFormFlowState.ts`
**Purpose**: Manages the core flow state (current step, completed steps, data)

**Responsibilities**:
- Initialize and maintain flow state
- Provide state getters and setters
- Handle state updates

### `useFormFlowData.ts`
**Purpose**: Manages form data and data synchronization

**Responsibilities**:
- Track form data across steps
- Provide data update methods
- Handle data persistence
- Merge step data with overall flow data

### `useFormFlowForm.ts`
**Purpose**: Integrates with React Hook Form

**Responsibilities**:
- Create and configure RHF form instance
- Handle form validation
- Sync form values with flow data
- Provide form methods (register, watch, setValue, etc.)

### `useFormFlowTransitions.ts`
**Purpose**: Handles step transitions and path calculation

**Responsibilities**:
- Calculate next/previous steps
- Determine valid navigation paths
- Handle conditional branching
- Recalculate paths when data changes

### `useFormFlowNavigation.ts`
**Purpose**: Provides navigation actions

**Responsibilities**:
- Implement next/back/goTo methods
- Validate navigation constraints
- Handle navigation errors
- Trigger navigation callbacks

### `useFormFlowNext.ts`
**Purpose**: Specialized hook for handling the "next" action with validation

**Responsibilities**:
- Execute step validation before advancing
- Handle async validation
- Submit final step (onComplete callback)
- Manage loading/error states during navigation

## Benefits of Refactoring

### 1. **Separation of Concerns**
Each hook has a single, well-defined responsibility, making the code easier to understand and maintain.

### 2. **Improved Testability**
Smaller hooks can be tested in isolation, leading to more comprehensive and focused unit tests.

### 3. **Better Code Reusability**
Internal hooks can potentially be reused in other parts of the library or exposed as public APIs in the future.

### 4. **Easier Debugging**
Issues can be isolated to specific hooks, simplifying debugging and troubleshooting.

### 5. **Maintainability**
Smaller files with focused logic are easier to review, update, and refactor.

## Migration Impact

This refactoring is **internal only** and does not affect the public API. The `useFormFlow` hook interface remains unchanged, ensuring backward compatibility.

## Usage

These hooks are only used internally by `useFormFlow`:

```typescript
export function useFormFlow<T extends FlowDefinition>(
  flow: T,
  options: UseFormFlowOptions<T> = {}
): UseFormFlowReturn<T> {
  // Internal hooks are composed here
  const state = useFormFlowState(flow, options)
  const data = useFormFlowData(state)
  const form = useFormFlowForm(flow, state, data, options)
  const transitions = useFormFlowTransitions(flow, state, data)
  const navigation = useFormFlowNavigation(transitions, state, options)
  const next = useFormFlowNext(form, navigation, state, options)

  return {
    state,
    form,
    next,
    back: navigation.back,
    goTo: navigation.goTo,
    canGoTo: navigation.canGoTo,
    reset: state.reset,
    setData: data.setData,
  }
}
```

## Future Improvements

- Add comprehensive unit tests for each internal hook
- Consider exposing some hooks as advanced APIs for power users
- Document performance characteristics of each hook
- Add examples of how to test components that use useFormFlow
