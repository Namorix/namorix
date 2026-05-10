# M3 — System Apps

## Mục tiêu

4 system apps: File manager, Terminal, Settings, Log viewer + API logs.

## Spec References

- System apps → `architecture.md#5.6`
- Terminal WebSocket → `architecture.md#7.2`
- REST API logs → `architecture.md#appendix-rest-api`

## Deliverables

### 1. Terminal App

- [ ] `xterm.js` integration
- [ ] `/namorix-terminal-ws` WebSocket endpoint
- [ ] PTY bridge (server side)
- [ ] Terminal component trong shell

### 2. File Manager App

- [ ] File browser UI
- [ ] Directory navigation
- [ ] File/folder listing
- [ ] Basic operations (open folder)

### 3. Settings App

- [ ] Theme toggle (light/dark/system)
- [ ] Locale selection
- [ ] Wallpaper selection
- [ ] Persist to backend via API

### 4. Log Viewer App

- [ ] `GET /api/logs/addons` — list addon logs
- [ ] `GET /api/logs?addonId=` — fetch logs
- [ ] Log stream UI (polling or WS)
- [ ] Filter by addon

### 5. System App Integration

- [ ] Mount vào WindowManager theo `appId`
- [ ] System app registry/map
- [ ] App launcher shortcuts

## File Structure Target

```
apps/desktop/frontend/src/
├── system-apps/
│   ├── terminal/
│   │   ├── TerminalApp.tsx
│   │   └── useTerminal.ts
│   ├── file-manager/
│   │   └── FileManagerApp.tsx
│   ├── settings/
│   │   └── SettingsApp.tsx
│   └── log-viewer/
│       └── LogViewerApp.tsx
```

## WebSocket Protocol

```typescript
// Client → Server
{ type: 'input'; data: string }
{ type: 'resize'; cols: number; rows: number }

// Server → Client
{ type: 'output'; data: string }
```