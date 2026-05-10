# Rule 2: Package Boundary (ESLint)

```
@namorix/core — allowed to import:
- Node.js builtins (if needed)
- @namorix/shared
- MUST NOT import internal packages (@namorix/backend-core, @namorix/ui, frontend)

@namorix/backend-core — allowed to import:
- @namorix/shared
- External packages (express, pino, jsonwebtoken, drizzle, etc.)
- Node.js builtins
- MUST NOT import @namorix/core

frontend — allowed to import:
- @namorix/core
- @namorix/shared
- React ecosystem

backend — allowed to import:
- @namorix/backend-core
- @namorix/shared
- Express ecosystem
```

- Enforce via ESLint rule or import plugin to ban cross-package boundaries
- Rationale: Prevent circular dependencies and leaking server implementation into browser code
