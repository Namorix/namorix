# Namorix Frontend

Vite + React shell for the Namorix desktop interface.

## Structure

```
frontend/
├── src/
│   ├── main.tsx                  # Entry: imports styles, init i18n, configureCore, render
│   ├── App.tsx                   # Router: /login, /register, / (guarded)
│   ├── controllers/
│   │   ├── auth.controller.ts    # login, register, logout — API calls
│   │   └── health.controller.ts  # health check
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── AuthPage.tsx      # Two-column layout (hero + form panel)
│   │   │   └── AuthPage.scss
│   │   └── index.ts
│   ├── hooks/
│   │   └── useAuthForm.ts        # Form state + validation hook
│   ├── pages/
│   │   ├── Login.tsx             # Username + password + remember-me toggle
│   │   ├── Register.tsx          # Username + password + confirmPassword
│   │   └── Desktop.tsx           # Shell UI (M3)
│   ├── styles/
│   │   ├── main.scss             # Imports @namorix/styles + local tokens
│   │   └── tokens.scss           # --nmx-auth-card-* tokens
│   └── i18n/
│       ├── index.ts              # NmxI18n instance with core + translation namespaces
│       └── locales/
│           ├── en.json           # English translations
│           └── vi.json           # Vietnamese translations (TODO)
└── vite.config.ts
```

## Development

```bash
pnpm dev          # Start Vite dev server (port 5173)
pnpm build        # Build for production
pnpm preview      # Preview production build
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@namorix/core` | Auth guards, http client, ApiError, i18n, ValidationRunner, constants |
| `@namorix/styles` | SCSS design tokens, reset, fonts |
| `@namorix/ui` | NmxButton, NmxForm, NmxInlineAlert, NmxToggle |
| `react-router-dom` | Client-side routing with guard pattern |
| `react-i18next` | i18n with layered namespaces |

## Key Patterns

### Guarded Routes
```typescript
// Routes are protected by async guards that check auth state
<GuardedRoute guard={authGuard}><Desktop /></GuardedRoute>
<GuardedRoute guard={loginGuard}><Login /></GuardedRoute>
```

### Client-side Validation
```typescript
import { validate, ValidationFields as F, formatApiError } from "@namorix/core"

const error = validate(t)
  .required(F.USERNAME, username)
  .minLength(F.PASSWORD, password, 6)
  .first()
```

### i18n Layering
```
@namorix/core (namespace "core")  →  common.validation.*, common.fields.*
frontend (namespace "translation") →  auth.login.*, auth.register.*
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |

## Upcoming (M3-M5)

- **Desktop Shell** — Window manager, taskbar, app launcher (M3)
- **System Apps** — File manager, Terminal, Settings, Log viewer (M3)
- **Addon Widget Slots** — DOM slot integration for addon widgets (M4)
- **Event Bus** — `@namorix/core` EventBus for shell↔addon communication (M4)
- **SignalR** — Realtime events (addon status, notifications) (M4)
