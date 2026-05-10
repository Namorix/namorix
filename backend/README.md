# Namorix Backend

Express + TypeScript API server for the Namorix desktop shell.

## Structure

```
backend/
├── src/
│   ├── index.ts              # Express app entry: DB start, middleware, routes, settings, cron
│   ├── config/
│   │   ├── index.ts          # Environment variables → config object
│   │   ├── types.ts          # Config interface
│   │   └── secret.ts         # JWT secret management (env or .secret file)
│   ├── routes/
│   │   ├── index.ts          # applyRoutes() — registerController(AuthController)
│   │   └── auth.ts           # AuthController class with decorators
│   ├── services/
│   │   ├── auth.service.ts   # signIn, signUp, verifyAccessToken, refreshToken, revokeToken
│   │   └── settings.service.ts  # getSetting, setSetting, isSignUpEnabled (cached)
│   ├── db/
│   │   ├── index.ts          # NmxDataBase instance, getDB()
│   │   └── schema.ts         # Drizzle schema: users, revokedTokens, settings
│   ├── middleware/
│   │   └── index.ts          # applyMiddleware = createMiddleware({ corsOrigin })
│   ├── utils/
│   │   ├── index.ts          # Barrel export
│   │   └── cookie.ts         # set/get/clear cookie helpers (HttpOnly, SameSite strict)
│   └── jobs/
│       └── cleanup.ts        # Daily cron: cleanupRevokedTokens()
└── data/
    ├── namorix.db            # SQLite database
    ├── .secret               # Auto-generated JWT secret (dev only)
    └── migrations/           # Drizzle migrations
```

## Development

```bash
pnpm dev           # Start dev server with tsx watch (port 3000)
pnpm build         # Build for production (tsc)
pnpm start         # Start production server
pnpm db:generate   # Generate Drizzle migrations
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@namorix/backend-core` | Logger, JWT, DB, middleware, validate, decorators |
| `@namorix/shared` | Types, constants, error codes, API routes |
| `express` | HTTP server |
| `bcrypt` | Password hashing |
| `better-sqlite3` | SQLite driver |
| `drizzle-orm` | Type-safe SQL |
| `node-cron` | Revoked token cleanup scheduler |

## Decorator-based Routes

Routes are declared with decorators instead of manual `router.post(path, middleware, handler)`:

```typescript
@Controller("/api/auth")
export class AuthController {
  @Validate({
    username: { required: true, type: "string", minLength: 1, maxLength: 32, trim: true },
    password: { required: true, type: "string", minLength: 8 },
  })
  @Post("/signin")
  async signIn(req: Request, res: Response) {
    // req.body already validated by @Validate middleware
  }
}
```

Registration via `registerController(router, AuthController)` — reads Reflect metadata from decorators and wires Express routes automatically.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DESKTOP_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS |
| `COOKIE_SECURE` | `false` | HTTPS only cookies |
| `JWT_SECRET` | (auto-generated) | JWT signing secret |
| `DATA_DIR` | `./data` | Database and secrets directory |
| `JWT_ACCESS_TTL` | `15m` | Access token lifetime |
| `JWT_REFRESH_TTL` | `7d` | Refresh token lifetime |
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | Docker socket (M4) |
| `ADDON_NETWORK` | `namorix_net` | Docker network (M4) |
| `ADDON_HOST_BIND` | `127.0.0.1` | Bind addon ports (M4) |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signin` | Public | Login with username/password |
| POST | `/api/auth/signup` | Public | Create new user |
| POST | `/api/auth/signout` | Cookie | Logout and revoke token |
| GET | `/api/auth/session` | Cookie | Get current user session |
| POST | `/api/auth/refresh` | Cookie | Refresh access + rotate refresh token |
| GET | `/api/auth/status` | Public | Get auth status (needsSignup, signUpEnabled) |
