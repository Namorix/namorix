# CLAUDE.md

This file provides guidance to AI agents when working with this repository.

## REQUIRED: Read Memory Bank on Start

Every session must read:
- `.claude/memory/MEMORY.md` — start here
- `.claude/memory/activeContext.md` — current work focus
- `.claude/memory/progress.md` — milestone status + version history

All coding rules are in `.claude/rules/` — read the relevant ones for your task.

## Project Overview

**Namorix** is a browser-based desktop shell, self-hosted. Desktop acts as the central orchestrator: user authentication, addon container lifecycle coordination, and event bus.

## Architecture Principles

| Principle | Explanation |
|------------|-------------|
| Desktop is the only auth server | Addon and shell trust sessions issued by Desktop; addon only **verifies** via API. |
| HttpOnly cookie for tokens | Reduces XSS risk. |
| Monorepo + publishable `core` package | Shell and third-party addons share contracts (`@namorix/core`). |
| SQLite + EF Core | Simple for single-node self-hosted (ASP.NET Core 8 + Entity Framework Core). |
| Docker via Unix socket | Desktop backend runs on same machine as Docker. |
| Socket.IO | Unified realtime layer for shell events. |

## Tech Stack

- **Frontend:** Vite + React (window manager, taskbar, system apps)
- **Backend:** ASP.NET Core 8, WebSocket (shell + terminal), auth, logs
- **Packages:** `@namorix/core` (browser-only), `@namorix/shared` (types/constants), `@namorix/ui` (React primitives), `@namorix/styles` (SCSS tokens)
- **Database:** SQLite + EF Core
- **Terminal:** xterm.js
- **Realtime:** Socket.IO

## Package Boundaries

| Package | Can Import |
|---------|------------|
| `@namorix/shared` | **Nothing** internal — zero deps |
| `@namorix/core` | @namorix/shared, React ecosystem |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | @namorix/core, React, @namorix/styles |
| `frontend` | @namorix/core, @namorix/styles, @namorix/ui, @namorix/shared, React |
| `backend` | @namorix/shared, ASP.NET Core 8 |

## Key Interfaces

```typescript
// API response
interface ApiResponse<T = null> {
  success: true; data: T;
} | {
  success: false; error: string; code?: string; field?: string; meta?: ValidationErrorMeta;
}

// AuthChecker (async — calls GET /api/auth/session)
interface AuthChecker {
  isAuthenticated: () => Promise<boolean>
  checkHasUsers: () => Promise<boolean>
  isRegistrationOpen: () => Promise<boolean>
}
```

## Key Patterns

- **Controller pattern** for frontend API calls (`frontend/src/assets/controllers/`)
- **Decorator-based routing** (C#: `[HttpGet]`, `[HttpPost]`, `[Validate]`, `[Controller]`; Frontend: registerController)
- **CSRF double-submit** — `nmx_csrf_token` cookie + `X-CSRF-Token` header, enabled via `CSRF_MODE=double-submit`
- **i18n layering** — core namespace + frontend translation namespace, `fallbackNS: ["core", "translation"]`
- **Validation two-tier** — server: `[Validate]` attribute with schema; client: `ValidationRunner` + `formatApiError()`
- **Token whitelist** — refresh_tokens table with fingerprint + IP tracking for theft detection

## Development

```bash
# Frontend
npm run dev --workspace frontend   # Frontend (Vite port 5173)

# Backend (C# .NET 8)
cd backend && dotnet run            # Backend (port 3000)

# Build all
npm run build                      # Build all packages
npm run test                       # Run tests
```

## Milestones

1. **M1** — Static shell UI + mock auth ✅
2. **M2** — Full auth backend ✅
3. **M3** — System apps (File manager, Terminal, Settings, Log viewer) 🔜
4. **M4** — External addon system (Docker lifecycle, addon manager UI)
5. **M5** — `@namorix/core` publish npm + addon integration guide

---

## Rule 0: Code Suggestion Only (Suggestion Mode)

AI agents in this project operate in suggestion mode only:

- **DO:** Suggest code snippets, point out issues, ask clarifying questions before implementing
- **DON'T:** Write code without being explicitly requested by the user
- **DON'T:** Refactor, rewrite, or "improve" code without user approval

When the user asks for something that requires code changes:
1. First understand the current state (read relevant files)
2. Present a clear plan or approach (possibly with code snippets)
3. Wait for user confirmation before implementing
4. After user approval, write the actual code

**Rationale:** This prevents unwanted changes and ensures the user maintains full control over the codebase.

---

## Rule 1: TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

- Applies to: all packages and apps
- Rationale: ES2023 features (top-level await, decorators), bundler resolution for Vite, strict mode reduces bugs

---

## Rule 2: REQUIRED — Scan Codebase Before Suggesting

Before suggesting code or solutions, you MUST scan the relevant codebase first:

1. Read the actual files involved in the task
2. Check git diff to see what changed recently
3. Verify existing patterns and conventions
4. Only then provide suggestions based on what found

Never suggest code without understanding the current state. This prevents:
- Duplicate implementations
- Conflicts with existing code
- Ignoring recent changes
- Reinventing existing solutions

---

## Rule 3: Package Boundary (ESLint)

```
@namorix/core — allowed to import:
- @namorix/shared
- React ecosystem

frontend — allowed to import:
- @namorix/core
- @namorix/shared
- @namorix/ui
- @namorix/styles
- React ecosystem

backend (ASP.NET Core) — allowed to import:
- @namorix/shared
- ASP.NET Core 8 ecosystem
```

- Enforce via ESLint rule or import plugin to ban cross-package boundaries
- Rationale: Prevent circular dependencies and leaking server implementation into browser code

---

## Rule 4: Import/Export Pattern

```typescript
// ✅ Correct — barrel export in index.ts
export { getSession } from "./auth"
export { connectEvents } from "./events"

// ❌ Wrong — re-export not through barrel
import { getSession } from "@namorix/core/auth"
```

## Component File Structure
- Export named for React components (NOT default export)
- Export named for utilities/helpers
- No default export for utility functions

## Import Order (separate groups with one blank line)
```
1. React / framework
2. @namorix/core
3. @namorix/shared
4. Internal imports (./, ../)
5. Types (type imports only)
```

---

## Rule 5: React Component Rules

```typescript
// ✅ Correct — named export
const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ windowId, title, onClose }) => {
  const { focusWindow } = useWindowsStore()
  // ...
}

// ❌ Wrong — no default export for component
export default function WindowTitleBar() {}
```

## File Naming
- **PascalCase** for component files: `WindowTitleBar.tsx`
- **camelCase** for non-component files: `useWindowState.ts`

## Hooks Naming
- Pattern: `use{Resource}` or `use{Action}`
- Examples: `useAuthStore`, `useWindowsStore`, `useAddonsStore`

## Store (Zustand) Pattern
- File: `{name}.store.ts`
- Export hook: `const use{Name}Store = create<{Name}State>()((set, get) => ({...}))`

---

## Rule 6: UI Primitives (`@namorix/ui`)

## Naming Convention

| Element | Pattern | Example |
|---------|---------|---------|
| Component | `Nmx` prefix + PascalCase | `NmxButton`, `NmxInput` |
| Props interface | `[ComponentName]Props` | `NmxButtonProps`, `NmxInputProps` |
| CSS class | `nmx-kebab-case` BEM | `nmx-button`, `nmx-button--primary` |

## Component Structure
```
packages/ui/src/
├── Button/
│   ├── NmxButton.tsx
│   ├── NmxButton.module.scss
│   └── index.ts
├── Input/
│   ├── NmxInput.tsx
│   ├── NmxInput.module.scss
│   └── index.ts
└── index.ts    # barrel export
```

## Component Rules
- Functional components only (no class components)
- Props must have explicit TypeScript interface
- No inline styles — all styling via SCSS module
- No hardcoded colors or spacing — use `--nmx-*` CSS variables from `@namorix/styles`
- Export named from `index.ts`

## Usage
```tsx
import { NmxButton } from "@namorix/ui"
import "@namorix/styles"

const MyComponent = () => (
  <NmxButton variant="primary" onClick={handleClick}>
    Submit
  </NmxButton>
)
```

## SCSS Tokens from `@namorix/styles`
```scss
@use "@namorix/styles";

.nmx-button {
  padding: var(--nmx-spacing-2) var(--nmx-spacing-4);
  border-radius: var(--nmx-radius-md);
  background-color: var(--nmx-color-primary);
  color: var(--nmx-color-white);
  font-family: var(--nmx-font-sans);
}
```

---

## Rule 7: Error Handling

## Controller — throw ApiError on non-success response
```typescript
import { ApiError } from "@namorix/core"

if (!data.success) {
  throw ApiError.fromResponse(data)
}
```

## Page Component — use formatApiError for centralized error formatting
```typescript
import { formatApiError } from "@namorix/core"

catch (err: unknown) {
  // formatApiError resolves: validation error → auth error → null
  const message = formatApiError(t, err) ?? t("auth.login.errors.generic")
  setAlert({ message, variant: "error" })
}
```

## Client-side Validation — use ValidationRunner
```typescript
import { validate, ValidationFields as F } from "@namorix/core"

const error = validate(t)
  .required(F.USERNAME, username)
  .minLength(F.PASSWORD, password, 6)
  .first()
if (error) { setAlert({ message: error, variant: "error" }); return }
```

## Try/Catch
- Backend: try/catch in handler, log error then return 500
- Frontend: try/catch in event handler or component, display toast/notification

---

## Rule 8: Git Conventions

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
- `ui`: @namorix/ui
- `shared`: @namorix/shared
- `styles`: @namorix/styles
- `frontend`: frontend
- `backend`: backend (ASP.NET Core)
- `root`: monorepo root

### Examples
```
feat(frontend): add window drag and resize
fix(core): correct token refresh logic
docs(architecture): update WebSocket spec
```

## PR Title
Same format as commit. Body describes WHAT and WHY, not HOW.

---

## Rule 9: File & Folder Structure

## Package Structure (Required)

```
packages/
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # barrel export
│       ├── auth/index.ts
│       ├── http/index.ts      # ApiError, http client
│       ├── router/index.ts    # GuardedRoute, guards
│       ├── config.ts
│       └── utils/cx.ts
├── styles/
│   ├── package.json
│   └── src/
│       ├── tokens.scss
│       ├── reset.scss
│       ├── fonts.scss
│       ├── mixins.scss
│       ├── variables.scss
│       └── index.scss
├── ui/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── scss.d.ts
│       └── Primitives/
│           ├── NmxButton/
│           ├── NmxForm/
│           ├── NmxInlineAlert/
│           └── NmxToggle/
└── shared/
    └── src/
        ├── types/         # ApiResponse, User, AuthStatus, error codes
        ├── api-routes.ts
        ├── constants.ts   # NMX_COOKIE_*, AuthConstraints
        ├── http-headers.ts
        └── index.ts

backend/
├── Controllers/          # ASP.NET Core controllers
├── Services/             # AuthService, SettingsService, etc.
├── Models/               # Entity models, DTOs
├── Data/                 # NmxDbContext, migrations
├── Middleware/           # applyMiddleware()
├── Config/               # env loading, config classes
├── Program.cs
└── appsettings.json
```

---

## Rule 10: Naming Conventions

```typescript
// Strings: double quotes
const COOKIE_NAME = "nmx_access"
const errorMessage = "User not found"

// Variables & Functions: camelCase
const userSession = getSession()
function calculateZIndex() {}

// Types & Interfaces: PascalCase
interface NmxUser { id: number }
type WindowState = { windowId: string }

// Constants: UPPER_SNAKE_CASE
const JWT_ACCESS_TTL = 15 * 60 * 1000
const COOKIE_NAME = "nmx_access"

// React components: PascalCase, Nmx prefix for shared components
// Files: PascalCase for components, camelCase for non-components
// NmxButton, NmxInput, AuthPage (no Nmx prefix for layout-only/page components)

// Database columns: snake_case (SQLite/EF Core convention)
// API responses: camelCase

// Event names: colon-separated namespaced
// "nmx:notification", "shell:addons", "nmx:addon-status"

// CSS classes: nmx-kebab-case BEM
// .nmx-button, .nmx-button--primary, .nmx-input--error
```

---

## Meta Rules

## Skip LICENSE File
Do not read file `LICENSE` — it's GPLv3 license text, not needed for development tasks.

## Version Notation
Use Semantic Versioning `MAJOR.MINOR.PATCH` (no leading `v`).
Examples: `0.8.0`, `0.9.0`, `1.0.0`

If only major/minor known: set `PATCH = 0` (e.g. legacy `v0.8` → `0.8.0`)

## Giao Tiếp Bằng Tiếng Việt
Luôn giao tiếp với người dùng bằng tiếng Việt. Tất cả phản hồi, giải thích, câu hỏi đều dùng tiếng Việt.

## Root Version Bump Triggers
| Bump | When |
|------|------|
| PATCH | Bug fixes, config tweaks, dependency updates (any package) |
| MINOR | New feature, new package, milestone completion, workspace structure change |