# M1 — Static Shell UI + Mock Auth Page

## Mục tiêu

Layout desktop, window manager cơ bản, router, login UI. **Không bắt buộc backend thật** — mock data OK.

## Spec References

- Repository structure → `architecture.md#2`
- Shell UI architecture → `architecture.md#5`
- Development setup → `architecture.md#9`

## Deliverables

### 1. Project Setup

- [ ] `package.json` root với workspaces
- [ ] TypeScript config (base + per-package)
- [ ] ESLint + Prettier config
- [ ] Vite config cho frontend
- [ ] Directory structure đầy đủ

### 2. Shell UI Layout

- [ ] Desktop background (wallpaper)
- [ ] Taskbar component (bottom bar)
- [ ] AppLauncher component (menu/icon grid)
- [ ] Desktop icons area

### 3. Window Manager

- [ ] `WindowState` type
- [ ] `windows.store.ts` (Zustand)
- [ ] `Window.tsx` base component
- [ ] Window dragging (pointer events)
- [ ] Window resizing
- [ ] Focus management (z-index, focusOrder)
- [ ] Minimize/Maximize/Close

### 4. Routing

- [ ] Login page (`/login`)
- [ ] Desktop page (`/`)
- [ ] Route guards (redirect to login if not auth)

### 5. Mock Auth (Frontend Only)

- [ ] `auth.store.ts` với mock user
- [ ] Login form UI
- [ ] Auth overlay when not logged in

## File Structure Target

```
apps/desktop/frontend/
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/        # Taskbar, AppLauncher, etc.
    ├── windows/          # Window, WindowTitleBar, etc.
    ├── pages/            # Login, Desktop
    ├── stores/           # auth.store.ts, windows.store.ts
    └── styles/
```