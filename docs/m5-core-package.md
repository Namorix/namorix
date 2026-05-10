# M5 — @namorix/core Package + Addon Integration Guide

## Mục tiêu

Hoàn thiện `@namorix/core` API, publish lên npm, viết addon integration guide.

## Spec References

- @namorix/core spec → `architecture.md#3`
- Subpath exports → `architecture.md#3.2`
- External addon example → `architecture.md#3.3`
- Package.json exports field → `architecture.md#3.4`

## Deliverables

### 1. @namorix/core — Hoàn thiện API

#### `@namorix/core/auth`
```typescript
export function getSession(baseUrl: string): Promise<NmxSession | null>
export function refreshToken(baseUrl: string): Promise<NmxSession | null>
export function onTokenExpired(cb: () => void): () => void
```

#### `@namorix/core/events`
```typescript
export function connectEvents(baseUrl: string): NmxEventClient

interface NmxEventClient {
  subscribe<K extends keyof NmxEventMap>(
    event: K,
    cb: (data: NmxEventMap[K]) => void
  ): () => void
  publish<K extends keyof NmxEventMap>(event: K, data: NmxEventMap[K]): void
  disconnect(): void
}
```

#### `@namorix/core/http`
```typescript
export function createApiClient(baseUrl: string): NmxApiClient

interface NmxApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  // Auto-refresh on 401, retry once
}
```

#### `@namorix/core/types`
```typescript
export interface NmxUser { id: number; username: string; role: number }
export interface NmxSession { user: NmxUser; expiresAt: string }
export interface NmxAddonManifest { id: string; displayName: string; internalPort: number }
export interface NmxNotification { message: string; level?: 'info' | 'warning' | 'error' }
export interface NmxAddonStatus { addonId: string; status: 'installed' | 'running' | 'stopped' | 'error' }

export interface NmxEventMap {
  'nmx:notification': NmxNotification
  'nmx:addon-status': NmxAddonStatus
}
```

### 2. Package Configuration

```json
{
  "name": "@namorix/core",
  "version": "0.0.0",
  "type": "module",
  "sideEffects": false,
  "exports": {
    "./auth": { "types": "./dist/auth/index.d.ts", "import": "./dist/auth/index.js" },
    "./events": { "types": "./dist/events/index.d.ts", "import": "./dist/events/index.js" },
    "./http": { "types": "./dist/http/index.d.ts", "import": "./dist/http/index.js" },
    "./types": { "types": "./dist/types/index.d.ts", "import": "./dist/types/index.js" }
  },
  "files": ["dist"],
  "publishConfig": { "access": "public" }
}
```

- [ ] Build pipeline (Vite hoặc tsup)
- [ ] Type declarations output
- [ ] npm credentials setup

### 3. Addon Integration Guide

**Doc structure:**
1. Quick start — `npm install @namorix/core`
2. Authentication flow
3. Making API calls
4. Listening to events
5. Docker image labels required

**Example addon code:**
```typescript
import { getSession } from '@namorix/core/auth'
import { connectEvents } from '@namorix/core/events'

const DESKTOP = 'http://192.168.1.100:3000'

// Check session
const session = await getSession(DESKTOP)
if (!session) {
  window.location.href = `${DESKTOP}/signin?redirect=${encodeURIComponent(location.href)}`
}

// Listen for notifications
const client = connectEvents(DESKTOP)
client.subscribe('nmx:notification', (data) => {
  showToast(data.message)
})
```

### 4. Testing @namorix/core

- [ ] Unit tests cho từng subpath
- [ ] Mock `fetch` để test refresh logic
- [ ] Test events connection/reconnection
- [ ] Test 401 retry behavior

### 5. Version Compatibility

**Semantic Versioning:**

| Change | Semver | Example |
|--------|--------|---------|
| Bug fix, backward compatible | PATCH | `1.0.0` → `1.0.1` |
| New feature, backward compatible | MINOR | `1.0.0` → `1.1.0` |
| Break change | MAJOR | `1.0.0` → `2.0.0` |

**Desktop backend support:** Minimum **N-1 minor version**. Nghĩa là khi `@namorix/core` đang ở `2.3.0`, backend phải support cả `2.2.x`, `2.1.x`, `2.0.x`.

**Addon developer responsibility:**
- Khi update `@namorix/core`, check changelog trước
- Major version mới → đọc migration guide
- Test addon với version mới trước khi release

**Deprecation flow (server-side):**

```typescript
// Backend kiểm tra addon version header
const addonVersion = request.headers['x-nmx-version']

if (!isCompatible(addonVersion, serverVersion)) {
  // Emit deprecation event
  socket.emit('nmx:deprecation', {
    addonId,
    currentVersion: addonVersion,
    latestVersion: serverVersion,
    sunsetDate: calculateSunsetDate(), // 6 tháng
    message: 'Please update @namorix/core to latest version'
  })
}
```

## File Structure Target

```
packages/core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # barrel
│   ├── auth/
│   │   ├── index.ts
│   │   ├── getSession.ts
│   │   ├── refreshToken.ts
│   │   └── onTokenExpired.ts
│   ├── events/
│   │   ├── index.ts
│   │   ├── connectEvents.ts
│   │   └── NmxEventClient.ts
│   ├── http/
│   │   ├── index.ts
│   │   └── createApiClient.ts
│   └── types/
│       └── index.ts
├── tests/
│   ├── auth.test.ts
│   ├── events.test.ts
│   └── http.test.ts
└── README.md              # Integration guide
```