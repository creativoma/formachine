# Changesets Workflow

This project uses [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

## What is a Changeset?

A changeset is a file that describes the changes made to the package. Changesets automatically:
- Update package version according to semver
- Generate CHANGELOG.md entries

## Development Workflow

### 1. Make Code Changes

Work normally on your feature/fix.

### 2. Create a Changeset

When you finish your changes, create a changeset:

```bash
pnpm changeset
```

This will ask you:
1. **What type of change?** - Choose according to [Semantic Versioning](https://semver.org/):
   - `patch` (0.0.X) - Bugfixes, minor changes
   - `minor` (0.X.0) - New features (backwards compatible)
   - `major` (X.0.0) - Breaking changes
2. **Description** - Write a summary of the change

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
- Update version in package.json
- Generate/update CHANGELOG.md
- Remove the applied changesets

### 5. Publish (Maintainer)

```bash
pnpm release
```

This will:
- Run tests
- Build the package
- Publish to npm

## Changeset Examples

### New Feature (minor)

```markdown
---
"@creativoma/formachine": minor
---

Add support for async validators with debouncing
```

### Bugfix (patch)

```markdown
---
"@creativoma/formachine": patch
---

Fix useFormFlow not updating when flow changes
```

### Breaking Change (major)

```markdown
---
"@creativoma/formachine": major
---

BREAKING: Rename `createFlow` to `createFormFlow`
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

## File Structure

```
.changeset/
├── config.json           # Changesets configuration
├── README.md            # Auto-generated documentation
└── feature-name.md      # Your changesets (removed on version)

package.json             # Version automatically updated
CHANGELOG.md             # Automatically generated
```

## Configuration

See `.changeset/config.json` for:
- `access`: "public" - Public package on npm
- `baseBranch`: "main" - Base branch to compare

## References

- [Changesets Docs](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
