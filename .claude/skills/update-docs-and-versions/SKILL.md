---
name: update-docs-and-versions
description: |
  After completing a feature or fix, update project documentation (memory bank,
  progress.md) and bump package versions. Scans git first to only touch files
  affected by recent changes.
---

# Update Documentation & Package Versions

After a coding session, update memory bank docs and bump package versions following
the project's version rules. Always scan git first — never read unchanged files.

## Workflow

### Step 1: Scan Git Changes

```bash
git status --short          # staged + unstaged + untracked
git diff --stat             # unstaged changes
git diff --cached --stat    # staged changes
git log --oneline -5        # recent commits for context
```

### Step 2: Categorize Changed Files

Map each changed file to a package and determine impact:

| Changed Files | Package | Impact |
|--------------|---------|--------|
| `packages/core/src/` | @namorix/core | Check if new module, utility, or bug fix |
| `packages/backend-core/src/` | @namorix/backend-core | Check if new module, middleware, or bug fix |
| `packages/shared/src/` | @namorix/shared | Check if new type, constant, or error code |
| `packages/ui/src/` | @namorix/ui | Check if new component, or fix |
| `packages/styles/src/` | @namorix/styles | Check if new token, variable, or fix |
| `frontend/src/` | frontend | Check if new page, route, or bug fix |
| `backend/src/` | backend | Check if new endpoint, service, or bug fix |
| Root config files | root (namorix) | Check if workspace scripts, tooling changed |

### Step 3: Determine Version Bumps

Use the bump triggers from CLAUDE.md Meta Rules and `progress.md`:

| Package | PATCH bump | MINOR bump |
|---------|-----------|------------|
| root (namorix) | Bug fixes, config tweaks, dependency updates (any package) | New feature, new package, milestone completion, workspace structure change |
| frontend | Bug fixes, CSS tweaks | New pages, routing changes, auth flow, i18n |
| @namorix/core | Bug fixes | New utility, new type, new module (i18n, validation) |
| @namorix/styles | Token fixes | New token, new variable, new export |
| @namorix/ui | Bug fixes | New component, component breaking change |
| @namorix/backend-core | Bug fixes | New module (decorators, csrf), new middleware |
| @namorix/shared | Bug fixes | New type, new constant, new error code, new helper |
| backend | Bug fixes | New API endpoint, auth feature, refactor to decorators |

**Rule:** Only bump packages whose files actually changed. Don't bump unrelated packages.

### Step 4: Read Only What's Needed

Read ONLY these files (skip if unchanged):
- `.claude/memory/progress.md` — always read (current versions + history)
- `.claude/memory/activeContext.md` — always read (current focus)
- `.claude/memory/systemPatterns.md` — only if architecture changed
- `.claude/memory/techContext.md` — only if tech/deps changed
- `.claude/memory/productContext.md` — only if UX changed
- `.claude/memory/projectbrief.md` — rarely changes
- Package `.json` files — only for packages being bumped
- `docs/` markdown files — only if related to changed code

**Never read:**
- `LICENSE` (rule from CLAUDE.md Meta Rules)
- Unchanged packages
- `node_modules/`

### Step 5: Update Documentation

#### progress.md — always update if versions changed
1. Update the "Current Version" table with new versions
2. Add a new entry in "Version History" under today's date

#### activeContext.md — update if needed
1. Update "Recent Changes" with summary of what was done
2. Update "Next Steps" if milestone progress changed

#### Other memory files — only if relevant
- `systemPatterns.md`: new patterns, architecture decisions
- `techContext.md`: new deps, new config, new key files
- `productContext.md`: UX changes

### Step 6: Update package.json Versions

For each bumped package, update the `"version"` field in its `package.json`.

### Step 7: Present Changes for Approval

Show a table of all changes:

```
| File | Change |
|------|--------|
| .claude/memory/progress.md | Update versions table + history |
| .claude/memory/activeContext.md | Add recent changes entry |
| packages/core/package.json | 0.5.0 → 0.5.1 |
| ... | ... |
```

Ask user to confirm before writing.

## Important Rules

1. **Scan git first** — never guess what changed
2. **Only read changed files + required doc files** — skip everything else
3. **Don't bump unrelated packages** — only packages whose code changed
4. **Version notation:** `MAJOR.MINOR.PATCH`, no leading `v`
5. **Ask before writing** — present the plan, wait for approval
6. **Follow existing format** in progress.md — match the table style exactly
