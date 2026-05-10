---
name: scan-project-docs
description: |
  Scan project documentation selectively based on the task at hand. Reads AGENTS.md
  first to understand doc structure, then selectively reads only the relevant .agents/
  rules and memory files. Avoids reading everything — focuses on what matters.
---

# Scan Project Documentation

Read project docs selectively based on the current task. Start from AGENTS.md,
the project's documentation index, then branch to relevant files only.

## Workflow

### Step 1: Read the Index

Always start by reading `AGENTS.md` — it's the root doc that maps everything:
- Memory bank files to check
- Package boundaries
- Key patterns in use
- Rules index (which rule file covers what)

### Step 2: Map Task to Relevant Docs

| User Task | Read These Files |
|-----------|-----------------|
| Frontend/React work | `.agents/rules/06-react.md`, `.agents/rules/07-ui-primitives.md`, `.agents/rules/05-imports.md` |
| Backend/API work | `.agents/rules/04-package-boundary.md`, `.agents/rules/08-error-handling.md` |
| New feature | `.agents/memory/progress.md` (current version), `.agents/memory/activeContext.md` (current focus) |
| Bug fix | `.agents/rules/08-error-handling.md`, `.agents/memory/progress.md` (known issues) |
| Package changes | `.agents/rules/04-package-boundary.md`, `.agents/rules/03-typescript.md` |
| Git/commit | `.agents/rules/09-git.md` |
| New package/component | `.agents/rules/10-structure.md`, `.agents/rules/11-naming.md` |
| Documentation update | `.agents/rules/98-meta.md` (version notation) |
| Auth changes | `.agents/memory/systemPatterns.md` (auth flow section) |
| Any task | `.agents/memory/activeContext.md` (always — know current state) |

### Step 3: Read Selectively

1. Read AGENTS.md first
2. Read `.agents/memory/activeContext.md` (always)
3. Based on the task, read the rule files from the table above
4. Skip everything else — don't pre-read unnecessary files

### Step 4: Summarize

Output a concise summary:
```
## Relevant Context
- Current milestone: M3 (System Apps)
- Active work: <from activeContext.md>
- Key package versions: <from progress.md>

## Rules Applied
- <file>: <key rule summary>
- <file>: <key rule summary>

## Next Steps
- <what to do>
```

## Important

- **Never read all docs** — only what's relevant to the task
- **Always read activeContext.md** — know current state before any task
- **Skip LICENSE** — per `.agents/rules/98-meta.md`
- **Skip unchanged packages** — only read files in scope
- **Use git status** to check what files were recently changed before reading
