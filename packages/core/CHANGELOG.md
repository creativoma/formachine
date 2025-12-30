# @formachine/core

## 0.3.0

### Minor Changes

- 0ec7a68: Add comprehensive error handling system with FormFlowError class, error codes, and helper functions for creating specific error types. Includes 283 tests covering all error scenarios.
- 0ec7a68: Add static flow validation with validateFlowDefinition, assertValidFlow, and getFlowWarnings functions. Detects common flow issues like missing steps, invalid transitions, infinite loops, and unreachable steps. Includes 420 tests.
- 0ec7a68: Add memoization utilities (memoize, memoizeAsync, createMemoized) with LRU eviction, TTL support, and cache control. Includes 314 tests covering all caching scenarios.
- 0ec7a68: Add comprehensive type guard utilities (isZodError, isError, isDefined, isString, isNumber, isFunction, isObject, isPlainObject, assertNever) for better type safety. Includes 301 tests.

### Patch Changes

- 0ec7a68: Enhance ValidationResult type to support both ZodError and generic Error types. Improve error handling in createValidator with proper type guards.
- 0ec7a68: feat: add changeset files for versioning and changelog management
- 0ec7a68: Make 'next' property optional in AnyStepDefinition to support terminal steps properly.
- 0ec7a68: Update TypeScript configuration target from ES2020 to ES2022 for latest language features.
