# Rule 3: Import/Export Pattern

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
3. @namorix/backend-core
4. @namorix/shared
5. Internal imports (./, ../)
6. Types (type imports only)
```
