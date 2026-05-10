# AGENTS.md

This file provides guidance to AI agents when working with this repository.

## REQUIRED: Read Memory Bank + Rules on Start

Every session must read:
- `.agents/memory/MEMORY.md` — start here
- `.agents/memory/activeContext.md` — current work focus
- `.agents/memory/progress.md` — milestone status + version history

All coding rules are in `.agents/rules/` — read the relevant ones for your task.

## Project Overview

**Namorix** is a browser-based desktop shell, self-hosted. Desktop acts as the central orchestrator: user authentication, addon container lifecycle coordination, and event bus.

## Architecture Principles

| Principle | Explanation |
|------------|-------------|
| Desktop is the only auth server | Addon and shell trust sessions issued by Desktop; addon only **verifies** via API. |
| HttpOnly cookie for tokens | Reduces XSS risk. |
| Monorepo + publishable `core` package | Shell and third-party addons share contracts (`@namorix/core`). |
| SQLite + Drizzle | Simple for single-node self-hosted. |
| Docker via Unix socket | Desktop backend runs on same machine as Docker. |
| Socket.IO | Unified realtime layer for shell events. |

## Tech Stack

- **Frontend:** Vite + React (window manager, taskbar, system apps)
- **Backend:** Express API, WebSocket (shell + terminal), auth, logs
- **Packages:** `@namorix/core` (browser-only), `@namorix/backend-core` (server utilities), `@namorix/shared` (types/constants), `@namorix/ui` (React primitives), `@namorix/styles` (SCSS tokens)
- **Database:** SQLite + Drizzle
- **Terminal:** xterm.js
- **Realtime:** Socket.IO

## Package Boundaries

| Package | Can Import |
|---------|------------|
| `@namorix/shared` | **Nothing** internal |
| `@namorix/core` | React, @namorix/shared. **Not** backend-core/ui/frontend/backend |
| `@namorix/styles` | **Nothing** — pure SCSS |
| `@namorix/ui` | @namorix/core, React, @namorix/styles |
| `@namorix/backend-core` | @namorix/shared, express, pino, drizzle. **Not** @namorix/core |
| `frontend` | @namorix/core, styles, ui, shared, React |
| `backend` | @namorix/backend-core, @namorix/shared, Express |

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
- **Decorator-based routing** (`@Controller`, `@Get`, `@Post`, `@Validate`, `registerController`)
- **CSRF double-submit** — `nmx_csrf_token` cookie + `X-CSRF-Token` header, enabled via `CSRF_MODE=double-submit`
- **i18n layering** — core namespace + frontend translation namespace, `fallbackNS: ["core", "translation"]`
- **Validation two-tier** — server: `validate(schema)` middleware; client: `ValidationRunner` + `formatApiError()`
- **Symbol.for()** for decorator metadata keys (cross-module compatibility)

## Development

```bash
npm run dev --workspace backend    # Backend (port 3000)
npm run dev --workspace frontend   # Frontend (Vite port 5173)
npm run build                      # Build all packages
npm run test                       # Run tests
```

## Milestones

1. **M1** — Static shell UI + mock auth ✅
2. **M2** — Full auth backend ✅
3. **M3** — System apps (File manager, Terminal, Settings, Log viewer) 🔜
4. **M4** — External addon system (Docker lifecycle, addon manager UI)
5. **M5** — `@namorix/core` publish npm + addon integration guide

## Rules Index

Detailed coding rules are in `.agents/rules/`:

| File | Rule |
|------|------|
| `00-memory-bank.md` | REQUIRED: Read memory bank on start |
| `01-code-scan.md` | REQUIRED: Scan codebase before suggesting |
| `02-suggestion-mode.md` | Code suggestion only — no autonomous writing |
| `03-typescript.md` | TypeScript config (ES2022, strict, bundler) |
| `04-package-boundary.md` | Package boundary enforcement |
| `05-imports.md` | Import/export patterns, barrel exports |
| `06-react.md` | React component rules (named exports, PascalCase) |
| `07-ui-primitives.md` | UI primitives (Nmx prefix, BEM CSS) |
| `08-error-handling.md` | Error handling (ApiError, formatApiError) |
| `09-git.md` | Git conventions (branch, commit, PR) |
| `10-structure.md` | File & folder structure |
| `11-naming.md` | Naming conventions |
| `98-meta.md` | Meta rules (license skip, version notation, root bump triggers) |
