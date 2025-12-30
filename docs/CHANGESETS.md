# Changesets Workflow

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs for the monorepo packages.

## What is a Changeset?

A changeset is a file that describes the changes made and which packages will be affected. Changesets automatically:
- Update package versions according to semver
- Generate CHANGELOG.md entries for each package
- Manage internal dependencies between packages

## Development Workflow

### 1. Make Code Changes

Work normally on your feature/fix in the packages.

### 2. Create a Changeset

When you finish your changes, create a changeset:

```bash
pnpm changeset
```

This will ask you:
1. **Which packages changed?** - Select the affected packages
2. **What type of change?** - Choose according to [Semantic Versioning](https://semver.org/):
   - `patch` (0.0.X) - Bugfixes, minor changes
   - `minor` (0.X.0) - New features (backwards compatible)
   - `major` (X.0.0) - Breaking changes
3. **Description** - Write a summary of the change

A file will be created in `.changeset/` with your changes.

### 3. Commit the Changeset

```bash
git add .changeset
git commit -m "feat: add new feature"
```

Changesets should be included in the same PR/commit that introduces the changes.

### 4. Create Version (Maintainer)

When you're ready to publish:

```bash
pnpm version
```

This will:
- Update versions in package.json
- Generate/update CHANGELOG.md for each package
- Remove the applied changesets

### 5. Publish (Maintainer)

```bash
pnpm release
```

This will:
- Run tests
- Build packages
- Publish to npm

## Changeset Examples

### New Feature (minor)

```markdown
---
"@formachine/core": minor
---

Add support for async validators with debouncing
```

### Bugfix (patch)

```markdown
---
"@formachine/react": patch
---

Fix useFormFlow not updating when flow changes
```

### Breaking Change (major)

```markdown
---
"@formachine/core": major
"@formachine/react": major
---

BREAKING: Rename `createFlow` to `createFormFlow`
```

### Multiple Packages

```markdown
---
"@formachine/core": minor
"@formachine/react": minor
"@formachine/persist": patch
---

Add persistence TTL support with automatic cleanup
```

## Available Commands

- `pnpm changeset` - Create a new changeset
- `pnpm changeset status` - View pending changesets
- `pnpm version` - Apply changesets and update versions
- `pnpm release` - Build and publish packages

## Best Practices

1. **One changeset per feature/fix** - Keep changesets atomic
2. **Clear descriptions** - Write with users in mind
3. **Include in PR** - Always commit the changeset with the code
4. **Correct semver** - Use the appropriate level (patch/minor/major)
5. **Affect only what's needed** - Mark only packages that actually changed

## File Structure

```
.changeset/
├── config.json           # Changesets configuration
├── README.md            # Auto-generated documentation
└── feature-name.md      # Your changesets (removed on version)

packages/
├── core/
│   ├── package.json     # Version automatically updated
│   └── CHANGELOG.md     # Automatically generated
├── react/
│   ├── package.json
│   └── CHANGELOG.md
└── persist/
    ├── package.json
    └── CHANGELOG.md
```

## Configuration

See `.changeset/config.json` for:
- `access`: "public" - Public packages on npm
- `baseBranch`: "main" - Base branch to compare
- `updateInternalDependencies`: "patch" - How to update internal deps

## References

- [Changesets Docs](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
