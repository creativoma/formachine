# Contributing to FormMachine

Thank you for your interest in contributing to FormMachine! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful and constructive in all interactions. We aim to foster an inclusive and welcoming community.

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/formachine.git
   cd formachine
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

5. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Development Workflow

### Project Structure

The project is organized as a monorepo:

```
formachine/
├── packages/
│   ├── core/          # Core state machine and validation
│   ├── react/         # React hooks and components
│   ├── persist/       # Persistence adapters
└── examples/
    └── onboarding-flow/  # Example application
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Type check
pnpm typecheck
```

### Code Quality

We use Biome for linting and formatting:

```bash
# Check code
pnpm check

# Fix issues automatically
pnpm check:fix

# Format code
pnpm format:fix

# Lint code
pnpm lint:fix
```

**Important:** All code must pass `pnpm check` before submitting a PR.

### Running the Example

```bash
pnpm --filter onboarding-flow-example dev
```

Then open http://localhost:5173

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feat/add-xyz` - New features
- `fix/resolve-xyz` - Bug fixes
- `docs/update-xyz` - Documentation updates
- `refactor/improve-xyz` - Code refactoring
- `test/add-xyz` - Test additions

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(react): add useFormData hook
fix(core): handle edge case in path calculation
docs(readme): update installation instructions
```

### Testing Requirements

- All new features must include tests
- Bug fixes should include a test that would have caught the bug
- Aim for high test coverage (we currently have 168 tests)
- Tests should be clear and maintainable

### Code Style

- Use TypeScript for all code
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

## Pull Request Process

1. **Update from main**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Ensure quality checks pass**
   ```bash
   pnpm check
   pnpm test:run
   pnpm typecheck
   pnpm build
   ```

3. **Create a pull request**
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes

4. **Address review feedback**
   - Respond to all comments
   - Make requested changes
   - Re-request review when ready

## Areas for Contribution

### Good First Issues

Look for issues labeled `good-first-issue` for beginner-friendly tasks.

### Priority Areas

- **Documentation** - Examples, guides, API docs
- **Tests** - Improve coverage, add edge cases
- **Examples** - Real-world use cases
- **Performance** - Optimizations, benchmarks
- **Bug Fixes** - Check open issues

### Package-Specific

**@formachine/core**
- State machine improvements
- Validation utilities
- Type safety enhancements

**@formachine/react**
- New hooks
- Component improvements
- React 18+ features

**@formachine/persist**
- New storage adapters
- Migration utilities
- Performance optimizations

## Questions?

- Open a discussion on GitHub
- Check existing issues
- Review the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to FormMachine!
