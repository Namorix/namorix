# CLAUDE.md

This file provides guidance to AI agents when working with this repository.

## REQUIRED: Read Memory Bank on Start

Every session must read:
- `.claude/memory/MEMORY.md` — start here
- `.claude/memory/activeContext.md` — current work focus
- `.claude/memory/progress.md` — milestone status + version history

All coding rules are in `.claude/rules/` — read the relevant ones for your task.

## CodeGraph

CodeGraph builds a semantic knowledge graph of codebases for faster, smarter code exploration.

### If `.codegraph/` exists in the project

**NEVER call `codegraph_explore` or `codegraph_context` directly in the main session.** These tools return large amounts of source code that fills up main session context. Instead, ALWAYS spawn an Explore agent for any exploration question (e.g., "how does X work?", "explain the Y system", "where is Z implemented?").

**When spawning Explore agents**, include this instruction in the prompt:

> This project has CodeGraph initialized (.codegraph/ exists). Use `codegraph_explore` as your PRIMARY tool — it returns full source code sections from all relevant files in one call.
>
> **Rules:**
> 1. Follow the explore call budget in the `codegraph_explore` tool description — it scales automatically based on project size.
> 2. Do NOT re-read files that codegraph_explore already returned source code for. The source sections are complete and authoritative.
> 3. Only fall back to grep/glob/read for files listed under "Additional relevant files" if you need more detail, or if codegraph returned no results.

**The main session may only use these lightweight tools directly** (for targeted lookups before making edits, not for exploration):

| Tool | Use For |
|------|---------|
| `codegraph_search` | Find symbols by name |
| `codegraph_callers` / `codegraph_callees` | Trace call flow |
| `codegraph_impact` | Check what's affected before editing |
| `codegraph_node` | Get a single symbol's details |

### If `.codegraph/` does NOT exist

At the start of a session, ask the user if they'd like to initialize CodeGraph:

"I notice this project doesn't have CodeGraph initialized. Would you like me to run `codegraph init -i` to build a code knowledge graph?"

## Project Overview

**Namorix** is a browser-based desktop shell, self-hosted. Desktop acts as the central orchestrator: user authentication, addon container lifecycle coordination, and event bus.

## Architecture Principles

| Principle | Explanation |
|------------|-------------|
| Desktop is the only auth server | Addon and shell trust sessions issued by Desktop; addon only **verifies** via API. |
| HttpOnly cookie for tokens | Reduces XSS risk. |
| Monorepo + publishable `core` package | Shell and third-party addons share contracts (`@namorix/core`). |
| PostgreSQL + EF Core | Simple for single-node self-hosted (ASP.NET Core 8 + Entity Framework Core). |
| Docker via Unix socket | Desktop backend runs on same machine as Docker. |
| SignalR | Unified realtime layer for backend events. |

## Tech Stack

- **Frontend:** Vite + React (window manager, taskbar, system apps)
- **Backend:** ASP.NET Core 8, WebSocket (shell + terminal), auth, logs
- **Frontend packages:** `@namorix/core` (types, auth, http, i18n, guards), `@namorix/ui` (React primitives), `@namorix/styles` (SCSS tokens) — all at `frontend/packages/*`
- **Database:** PostgreSQL + EF Core
- **Terminal:** xterm.js
- **Realtime:** SignalR

## Package Boundaries

| Package | Can Import |
|---------|------------|
| `@namorix/core` | React ecosystem |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | @namorix/core, React |
| `frontend` | @namorix/core, @namorix/styles, @namorix/ui, React |
| `backend` | ASP.NET Core 8 |

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

- **Controller pattern** for frontend API calls (`frontend/src/controllers/`)
- **Decorator-based routing** (C#: `[HttpGet]`, `[HttpPost]`, `[Validate]`, `[Controller]`; Frontend: registerController)
- **CSRF double-submit** — `nmx_csrf_token` cookie + `X-CSRF-Token` header, enabled via `CsrfEnabled` config (C# middleware `UseCsrfProtection()`)
- **Session self-heal** — `AuthController.Session()` gọi `TryRefresh()` khi access token expired, tự động refresh qua refresh token cookie trước khi trả về 401
- **i18n layering** — core namespace + frontend translation namespace, `fallbackNS: ["core", "translation"]`
- **Validation two-tier** — server: `[Validate]` attribute with schema; client: `ValidationRunner` + `formatApiError()`
- **Token whitelist** — refresh_tokens table with fingerprint + IP tracking for theft detection

## Development

```bash
# Frontend (from repo root)
cd frontend && pnpm dev             # Frontend (Vite port 5173)

# Backend (C# .NET 8)
cd backend && dotnet run            # Backend (port 3000)

# Build all (from repo root)
cd frontend && pnpm build           # Build all frontend packages
cd frontend && pnpm test            # Run tests
```

## Milestones

1. **M1** — Static shell UI + mock auth ✅
2. **M2** — Full auth backend ✅
3. **M3** — System Addons (Built-in) ✅ (Desktop shell UI, addon contract + registry, Log Viewer, NetworkTraffic, theme system; File Manager, Settings 🔜)
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
- React ecosystem

frontend — allowed to import:
- @namorix/core
- @namorix/ui
- @namorix/styles
- React ecosystem

backend (ASP.NET Core) — allowed to import:
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
3. Internal imports (./, ../)
4. Types (type imports only)
```

---

## Rule 5: React Component Rules

```typescript
// ✅ Correct — named export
const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ windowId, title, onClose }) => {
  const dispatch = useAppDispatch()
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
- Examples: `useAppDispatch`, `useAppSelector`, `useWindowDrag`

## Store (Redux Toolkit) Pattern
- Slice file: `store/slices/{name}Slice.ts`
- Selector file: `store/selectors/{name}Selectors.ts`
- State normalized: `byId: Record<Id, Data>` + `order: Id[]` (O(1) lookup, minimal re-render)
- Actions via `useAppDispatch()` + action creators (stable references)
- `useAppSelector` defaults to `shallowEqual` for render optimization

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

## Component Classification

| Type | Tự quyết | Ví dụ |
|------|----------|-------|
| **Primitive** | size, variant, rounded riêng | NmxButton, NmxForm, NmxIcon, NmxInlineAlert, NmxToggle |
| **Composite** | Cha quyết → con CSS cascade | NmxCard → NmxCardHeader/Body/Footer |
| **Layout** | Chỉ gap/align/justify | NmxStack, NmxGrid (future) |

## Primitive Prop Pattern
```typescript
interface NmxPrimitiveProps {
  size?: "sm" | "md" | "lg" | "xl"   // default "md"
  variant?: "solid" | "outline" | "ghost"
  rounded?: "sm" | "md" | "lg" | "full" | boolean
  className?: string
  children?: React.ReactNode
  shouldRender?: boolean
}
```

## Component Rules
- Functional components only (no class components)
- Props must have explicit TypeScript interface
- No inline styles — all styling via SCSS module
- No hardcoded colors or spacing — use `--nmx-*` CSS variables from `@namorix/styles`
- Export named from `index.ts`
- Sub-component (Composite child) không có `size` prop — nhận từ cha qua CSS cascade

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

## Variant SCSS Pattern
```scss
// Variant dùng CSS custom properties để override
// Component khai báo fallback = giá trị mặc định
.nmx-button {
  background: var(--nmx-btn-bg, var(--nmx-color-primary));
  color: var(--nmx-btn-color, var(--nmx-color-on-primary));
  border: 1px solid var(--nmx-btn-border, transparent);

  &--ghost {
    --nmx-btn-bg: transparent;
    --nmx-btn-color: var(--nmx-color-on-surface);
    --nmx-btn-border: var(--nmx-color-surface-mid);
  }
}
```

## CSS Cascade Rule
- Size/variant modifier đặt ở component cha, sub-component cascade theo
- Sub-component không có `size` prop — font-size, padding inherit từ cha
- Component không chứa margin — layout cha lo bằng `gap`
- `shouldRender` thay cho conditional ternary bên ngoài

## Tonal Elevation (Material Design 3)
- **Surface tone stack** thay cho border/shadow để phân tách element
  - `--nmx-color-surface-lowest` — inputs, textareas
  - `--nmx-color-surface-low` — cards, panels
  - `--nmx-color-surface` — main shell background
  - `--nmx-color-surface-mid` — highlighted blocks, active tab bg
  - `--nmx-color-surface-high` — hover states
  - `--nmx-color-surface-highest` — strong emphasis, active chip
- **Không dùng `border`** để phân tách — dùng 2 surface tone kề nhau tạo ranh giới tự nhiên
- **Không dùng `box-shadow`** cho elevation — chỉ dùng cho overlay thật sự (modal, dropdown, tooltip)
- `--nmx-{component}-shadow` chỉ dùng ở overlay components, không dùng để tạo depth cho element tĩnh

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
- `styles`: @namorix/styles
- `frontend`: frontend
- `backend`: backend (ASP.NET Core)

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
frontend/packages/
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # barrel export
│       ├── auth/index.ts
│       ├── http/index.ts      # ApiError, http client
│       ├── router/index.ts    # GuardedRoute, guards
│       ├── i18n/index.ts
│       ├── config.ts
│       ├── apiRoutes.ts
│       ├── constants.ts
│       ├── theme/             # ThemeManifest, loader, registry
│       ├── providers/         # ThemeProvider
│       └── utils/cx.ts
├── styles/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── index.scss
│       ├── base/               # Structural styles
│       │   ├── index.scss
│       │   ├── _reset.scss
│       │   ├── _fonts.scss
│       │   ├── _mixins.scss
│       │   ├── _variables.scss
│       │   ├── _tokens.scss    # Structural tokens (radii, spacing, typography, layout)
│       │   ├── components/     # Component SCSS (shared by all themes)
│       │   │   ├── index.scss
│       │   │   ├── _button.scss
│       │   │   ├── _card.scss
│       │   │   ├── _form.scss
│       │   │   ├── _inline-alert.scss
│       │   │   └── _toggle.scss
│       │   └── layouts/        # Layout SCSS (shared by all themes)
│       │       ├── index.scss
│       │       └── _split.scss
│       └── themes/             # Theme CSS entries (compiled by Vite)
│           ├── default/
│           │   └── index.scss
│           └── dark/
│               ├── index.scss
│               └── _tokens.scss
├── ui/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── types/              # Shared types (base.ts, primitives.ts)
│       │   ├── index.ts
│       │   ├── base.ts
│       │   └── primitives.ts
│       ├── utils/              # cx helpers (cx, cxSize, cxSemantic, cxVariant)
│       │   ├── index.ts
│       │   ├── cx.ts
│       │   ├── cx-size.ts
│       │   ├── cx-semantic.ts
│       │   └── cx-variant.ts
│       ├── Components/         # Composite: cha quyết → con CSS cascade
│       │   ├── index.ts
│       │   └── NmxCard/
│       │       ├── NmxCard.tsx
│       │       ├── NmxCardContent.tsx
│       │       ├── NmxCardHeader.tsx
│       │       ├── NmxCardBody.tsx
│       │       ├── NmxCardFooter.tsx
│       │       └── index.ts
│       ├── Primitives/         # Độc lập, tự quyết size/variant/rounded
│       │   ├── index.ts
│       │   ├── NmxButton.tsx
│       │   ├── NmxForm/
│       │   │   ├── NmxForm.tsx
│       │   │   ├── NmxFormActions.tsx
│       │   │   ├── NmxFormField.tsx
│       │   │   ├── NmxFormInput.tsx
│       │   │   └── index.ts
│       │   ├── NmxIcon/
│       │   │   ├── NmxIconFont.tsx
│       │   │   ├── NmxIconFont.types.ts
│       │   │   ├── NmxIconBox.tsx
│       │   │   └── index.ts
│       │   ├── NmxInlineAlert.tsx
│       │   └── NmxToggle.tsx
│       └── Layouts/            # (future) Chỉ gap/align/justify
│           └── ...

backend/
├── Makefile
├── Namorix.sln
└── src/
    ├── Namorix.Core/        # Config, Constants, Models, Exceptions, Responses, Validation
    ├── Namorix.Adapters/    # Persistence (AppDbContext, migrations), Services (Auth, Permission, Settings, Theme, User)
    ├── Namorix.Server/      # Controllers, Middleware, Extensions, Helpers, Program.cs
    └── Namorix.Workers/     # TokenCleanupWorker (background service)
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

// CSS theme variables: --nmx-{component}-{property}
// --nmx-btn-bg, --nmx-btn-color, --nmx-btn-border
// --nmx-card-bg, --nmx-card-shadow, --nmx-card-radius
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

## Confirm Completion Before Moving On

IF người dùng chưa nói "Xong" / "Ok" / "Done":
- Chỉ xử lý đúng vấn đề đang bàn, không gợi ý thêm.

IF người dùng nói "Xong" / "Ok" / "Done":
- Phải dùng tool đọc lại toàn bộ file liên quan — không dựa vào memory.
- Chỉ sau khi đọc xong mới được báo cáo trạng thái hoặc suggest bước tiếp.
- Không được claim còn lỗi nếu chưa thật sự đọc file bằng tool.
- Nếu không có tool access → nói rõ "chưa đọc được file, bạn paste lên đi".
