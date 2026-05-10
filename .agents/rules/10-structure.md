# Rule 8: File & Folder Structure

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
├── backend-core/
│   └── src/
│       ├── db/            # NmxDataBase class
│       ├── decorators/    # @Controller, @Get, @Post, @Validate, registerController
│       ├── jwt/           # Token generation/verification
│       ├── logger/        # pino logger setup
│       ├── middleware/    # createMiddleware, csrf, json-error
│       ├── utils/         # response helpers
│       ├── validate/      # Schema-based validation
│       └── index.ts
└── shared/
    └── src/
        ├── types/         # ApiResponse, User, AuthStatus, error codes
        ├── api-routes.ts
        ├── constants.ts   # NMX_COOKIE_*, AuthConstraints
        ├── http-headers.ts
        └── index.ts

backend/
├── src/
│   ├── config/           # env loading, config export
│   ├── index.ts          # app entry
│   ├── routes/           # auth endpoints
│   ├── services/         # auth.service, settings.service
│   ├── middleware/       # applyMiddleware()
│   ├── db/               # schema, migrations
│   ├── utils/
│   └── jobs/             # cleanup cron
└── data/
    └── migrations/
```
