# Changelog

## 0.2.2

### Patch Changes

- chore: disable sourcemap generation in tsup configuration

## 0.2.1

### Patch Changes

- test: add comprehensive tests for logger, persistence adapters, form flow, and SSR utilities

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0

### Minor Changes

- refactor: migrate from monorepo to single package under @creativoma scope
  - Unify @formachine/core, @formachine/react, and @formachine/persist into single @creativoma/formachine package
  - Remove pnpm workspace structure and simplify to single package repository
  - Update all imports and examples to use @creativoma/formachine
  - Maintain multiple entry points: main, /core, and /persist for tree-shaking
  - Update documentation and package.json metadata
  - All 439 tests passing ✅

## Historical Changes

For changes prior to the monorepo migration, see the git history of the individual packages:

- Core functionality: `src/core/`
- React integration: `src/react/`
- Persistence utilities: `src/persist/`
