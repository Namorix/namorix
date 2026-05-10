# Rule 7: Git Conventions

## Branch Naming
```
feature/M{number}-{short-description}  # feature/M1-window-manager
bugfix/M{number}-{short-description}    # bugfix/M2-session-refresh
```

## Commit Message Format
```
{type}({scope}): {description}
```

### Types
- `feat`: new feature
- `fix`: bug fix
- `refactor`: behavior-preserving change
- `docs`: documentation
- `chore`: build, config, deps

### Scopes
- `core`: @namorix/core
- `backend-core`: @namorix/backend-core
- `ui`: @namorix/ui
- `shared`: @namorix/shared
- `styles`: @namorix/styles
- `frontend`: frontend
- `backend`: backend
- `root`: monorepo root

### Examples
```
feat(frontend): add window drag and resize
fix(core): correct token refresh logic
docs(architecture): update WebSocket spec
```

## PR Title
Same format as commit. Body describes WHAT and WHY, not HOW.
