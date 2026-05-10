# Rule 1: TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
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
- Rationale: ES2022 features (top-level await, decorators), bundler resolution for Vite, strict mode reduces bugs
