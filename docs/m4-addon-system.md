# M4 — External Addon System

## Mục tiêu

Docker lifecycle qua shell WS, DockerMonitor, Addon Manager UI, mở addon tab mới.

## Spec References

- External addon system → `architecture.md#6`
- Docker lifecycle → `architecture.md#6.1`
- DockerMonitor → `architecture.md#6.2`
- Shell WebSocket → `architecture.md#7.1`
- Docker labels → `architecture.md#appendix-docker-labels`

## Deliverables

### 1. Docker Integration (@namorix/backend-core)

- [ ] `docker.ts` — DockerClient class
- [ ] Docker socket connection
- [ ] Container lifecycle (pull, create, start, stop, remove)
- [ ] Port binding với `ADDON_HOST_BIND`

### 2. DockerMonitor

- [ ] Monitor running containers
- [ ] Detect containers với `namorix.addon=true` label
- [ ] Extract metadata từ labels:
  - `namorix.addon.id`
  - `namorix.addon.display_name`
  - `namorix.addon.internal_port`
- [ ] Emit events on addon status change

### 3. Shell WebSocket — Addon Management

**Server → Client events:**
- `shell:addons` — full snapshot on connect
- `shell:addon:logLine` — streaming logs

**Client → Server (admin only):**
- `shell:addon:install` — `{ imageRef: string }`
- `shell:addon:start` — `{ addonId: string }`
- `shell:addon:stop` — `{ addonId: string }`
- `shell:addon:remove` — `{ addonId: string }`
- `shell:addon:logs` — `{ addonId: string, since?: number }`

### 4. Addon Manager UI (Frontend)

- [ ] List installed addons
- [ ] Install new addon form (image ref)
- [ ] Start/Stop/Remove buttons
- [ ] View logs panel
- [ ] Status indicators (installed/running/stopped/error)

### 5. Addon Database Schema

- [ ] `addonInstalls` table (Drizzle)
- [ ] CRUD operations
- [ ] Sync với DockerMonitor state

### 6. Open Addon in New Tab

- [ ] `window.open` với addon URL
- [ ] `hostPort` from `addonInstalls`
- [ ] Verify addon is running before open

## File Structure Target

```
packages/backend-core/src/
└── docker.ts        # DockerClient + DockerMonitor

apps/desktop/backend/
├── src/
│   ├── websocket/
│   │   └── shellWs.ts    # Shell WS handler
│   └── services/
│       └── addonService.ts

apps/desktop/frontend/src/
├── stores/
│   └── addons.store.ts
├── components/
│   └── AddonManager/
│       ├── AddonList.tsx
│       ├── InstallForm.tsx
│       └── LogViewer.tsx
```

## Docker Labels (for external addon images)

```dockerfile
LABEL namorix.addon=true
LABEL namorix.addon.id=homethread
LABEL namorix.addon.display_name=HomeThread
LABEL namorix.addon.internal_port=4000
```