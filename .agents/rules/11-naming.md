# Rule 9: Naming Conventions

```typescript
// Strings: double quotes
const COOKIE_NAME = "nmx_access"
const errorMessage = "User not found"

// Variables & Functions: camelCase
const userSession = getSession()
function calculateZIndex() {}

// Types & Interfaces: PascalCase
interface NmxUser { id: number }
type WindowState = { windowId: string }

// Constants: UPPER_SNAKE_CASE
const JWT_ACCESS_TTL = 15 * 60 * 1000
const COOKIE_NAME = "nmx_access"

// React components: PascalCase, Nmx prefix for shared components
// Files: PascalCase for components, camelCase for non-components
// NmxButton, NmxInput, AuthPage (no Nmx prefix for layout-only/page components)

// Database columns: snake_case (SQLite/Drizzle convention)
// API responses: camelCase

// Event names: colon-separated namespaced
// "nmx:notification", "shell:addons", "nmx:addon-status"

// CSS classes: nmx-kebab-case BEM
// .nmx-button, .nmx-button--primary, .nmx-input--error
```
