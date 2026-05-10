# Rule 6: Error Handling

## Controller — throw ApiError on non-success response
```typescript
import { ApiError } from "@namorix/core"

if (!data.success) {
  throw ApiError.fromResponse(data)
}
```

## Page Component — use formatApiError for centralized error formatting
```typescript
import { formatApiError } from "@namorix/core"

catch (err: unknown) {
  // formatApiError resolves: validation error → auth error → null
  const message = formatApiError(t, err) ?? t("auth.signin.errors.generic")
  setAlert({ message, variant: "error" })
}
```

## Client-side Validation — use ValidationRunner
```typescript
import { validate, ValidationFields as F } from "@namorix/core"

const error = validate(t)
  .required(F.USERNAME, username)
  .minLength(F.PASSWORD, password, 6)
  .first()
if (error) { setAlert({ message: error, variant: "error" }); return }
```

## Try/Catch
- Backend: try/catch in Express handler, log error then return 500
- Frontend: try/catch in event handler or component, display toast/notification
