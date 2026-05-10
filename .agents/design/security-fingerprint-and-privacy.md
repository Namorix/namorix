# Security: Fingerprint & Privacy Design Doc

> Reference: kế hoạch từ AI agent về IP/UserAgent/Fingerprint cho JWT và GDPR/Privacy compliance
> Status: OUTDATED — Phase A và B đã implement. Cần review Phase C trở đi.

---

## 1. Hiện Trạng — Namorix Đã Có Gì

### 1.1 `refresh_tokens` table (ĐÃ CÓ)

```
packages/backend-core/src/db/schema.ts:11-22
```

| Column | Type | Note |
|--------|------|------|
| `jti` | text (PK) | JWT ID |
| `user_id` | integer (FK → users) | |
| `user_agent` | text | ← ĐÃ có |
| `fingerprint` | text | ← ĐÃ có |
| `ip_address` | text | ← ĐÃ có |
| `last_used_at` | text (ISO) | |
| `create_at` | text (ISO) | |
| `expires_at` | text (ISO) | |

Kết luận: Schema đã sẵn sàng 3 cột `userAgent`, `fingerprint`, `ipAddress`. Không cần migration.

### 1.2 Backend Auth Route ĐÃ Đọc Metadata (ĐÃ CÓ)

```
backend/src/routes/auth.ts:59-63
```

```typescript
const result = await signIn(username, password, {
  userAgent: req.headers["user-agent"] ?? "",
  fingerprint: String(req.headers["x-device-fingerprint"] ?? ""),
  ipAddress: getClientIp(req),
  rememberMe: rememberMe === true,
})
```

- `userAgent` ← từ header `user-agent` (browser gửi tự động)
- `fingerprint` ← từ header `x-device-fingerprint` (client-side)
- `ipAddress` ← từ `getClientIp(req)` (proxy-aware)

### 1.3 String Literals (ĐÃ CÓ — HttpHeader enum ĐÃ XÓA)

```
packages/shared/src/http-headers.ts
```

HttpHeader enum đã bị xóa (commit `4686069`) vì không tương thích với ESLint strictTypeChecked trên `IncomingHttpHeaders` computed keys.

Thay vào đó, dùng string literals trực tiếp:
```typescript
"user-agent"       // browser gửi tự động
"x-device-fingerprint"  // custom header
"content-type"
"x-csrf-token"
```

### 1.4 Token Whitelist Rotation (ĐÃ CÓ)

```
backend/src/services/auth.service.ts
```

- `signIn` — INSERT vào `refresh_tokens` với `userAgent`, `fingerprint`, `ipAddress`
- `refreshToken` — DELETE old + INSERT new. **Verification (Option C):** Nếu fingerprint thay đổi nhưng IP giống → update fingerprint và tiếp tục. Nếu cả fingerprint VÀ IP đều khác → revoke all tokens.
- `revokeAllUserTokens(userId)` — DELETE WHERE userId (chống reuse detection)
- `cleanupExpiredTokens()` — cron job daily 03:00

### 1.5 CSRF Double-Submit (ĐÃ CÓ)

```
packages/backend-core/src/middleware/csrf.ts
```

Enabled by default. CSRF cookie `httpOnly: false` để JS đọc được.

---

## 2. Khoảng Trống — Namorix Chưa Có Gì

### 2.1 Frontend KHÔNG gửi fingerprint ✅ B1 DONE

Frontend đã có `generateFingerprint()` trong `packages/core/src/fingerprint/`. Component collection sử dụng `FingerprintComponents` interface, hash với SHA-256 (hoặc base64 fallback nếu non-HTTPS). Fingerprint được attach vào mọi request qua `RequestBuilder.json()`.

### 2.2 `rememberMe` toggle ✅ ĐÃ FIX

`SignIn.tsx` đã wired `rememberMe` toggle vào `authController.signIn(username, password, rememberMe)`. Backend nhận đúng boolean.

### 2.3 `trust proxy` + `getClientIP()` ✅ ĐÃ IMPLEMENT

`app.set('trust proxy', true)` đã được wire vào `createMiddleware`. Hàm `getClientIP()` trong `backend-core/src/utils/get-client-ip.ts` với proxy header priority chain: CF → X-Forwarded-For → X-Real-IP → X-Client-IP → True-Client-IP.

### 2.4 KHÔNG có fingerprint validation khi refresh ✅ B2 DONE (Option C)

Backend đã so sánh fingerprint khi refresh token với **Option C (Balanced)**:
- Nếu fingerprint khác:
  - VÀ IP cũng khác → revoke all tokens (high risk — device + location changed)
  - Chỉ fingerprint khác, IP giống → update fingerprint, continue (browser/OS update)

Logic trong `auth.service.ts:refreshToken()` với params `currentFingerprint` và `currentIp`.

### 2.5 KHÔNG có Privacy/Cookie Consent

- Không có cookie banner
- Không có privacy policy page
- Không có cookie consent management
- Không có GDPR endpoints (data export, account deletion)
- Không có consent-aware fingerprinting (client-side opt-in/opt-out)

### 2.6 Cookie thiếu `secure` flag ✅ ĐÃ FIX

`secureCookie` đã được thêm vào `MiddlewareConfig` và wired vào tất cả cookie setters trong `backend-core`. Env var `SECURE_COOKIE` (thay thế `COOKIE_SECURE`).

### 2.7 Không có session listing endpoint

Không có cách nào để user xem danh sách active sessions.

### 2.8 `/signout-all` chưa có trong `ApiAuthRoutes` ✅ ĐÃ FIX

Backend có endpoint và đã được thêm vào `packages/shared/src/api-routes.ts` với `signOutAll: "/signout-all"` (commit `4686069`).

---

## 3. Phân Tích Reference Plan vs Namorix

### 3.1 Về IP Collection

| Reference Plan | Namorix |
|----------------|---------|
| `getClientIP()` với 6 priority levels (Cloudflare, X-Forwarded-For, X-Real-IP...) | ✅ Đã implement (`getClientIp()` trong backend-core) |
| IP validation (IPv4/IPv6 regex) | Không có |
| `cleanIP()` (remove `::ffff:` prefix) | ✅ Đã có trong `getClientIp()` |

**Đánh giá:** Namorix đã implement đủ cho self-hosted use case.

### 3.2 Về Fingerprint

| Reference Plan | Namorix |
|----------------|---------|
| 3 levels: Basic (IP+UA), Medium (+Accept headers), Advanced (+Sec-* headers) | Chỉ nhận 1 header `x-device-fingerprint` từ client |
| SHA256 hash của concatenated components | Backend nhận fingerprint do client tự tạo |
| Fingerprint nhúng vào JWT payload | Không nhúng vào JWT |
| So sánh fingerprint khi refresh → từ chối nếu mismatch | Không so sánh |

**Đánh giá:** Reference plan nhúng fingerprint vào JWT + verify khi refresh. Namorix đang theo hướng khác: lưu fingerprint trong DB row (`refresh_tokens`), không nhúng vào JWT. Cả hai approach đều valid, nhưng cần quyết định dùng cách nào.

### 3.3 Về Privacy/GDPR

Reference plan cover đầy đủ: cookie banner, privacy policy, terms of service, consent manager, customize modal, data export endpoint, account deletion. Namorix chưa có gì.

**Lưu ý:** Namorix là self-hosted desktop shell → không phải public SaaS. GDPR áp dụng khác với self-hosted software. Tuy nhiên, nếu có ý định publish cho EU users, cần compliance.

---

## 4. Thiết Kế Đề Xuất

### Nguyên tắc thiết kế

1. **Không over-engineer** — Namorix là self-hosted, không phải public cloud SaaS
2. **Dùng những gì đã có** — schema, string literals (HttpHeader enum đã xóa), CSRF middleware đã sẵn sàng
3. **Theo pattern hiện tại** — decorator-based routes, controller pattern, Nmx primitives
4. **Phân tách rõ: security (bắt buộc) vs privacy compliance (nice-to-have cho self-hosted)

> ⚠️ **Lưu ý:** HttpHeader enum đã bị xóa (commit `4686069`) — dùng string literals thay thế.**

---

### Phase A: Fix Gaps ✅ ĐÃ IMPLEMENT

> **Status:** Tất cả A1-A4 đã hoàn thành. Ghi lại đây để track progress.

#### A1: Sửa `rememberMe` flow ✅

**Files đã thay đổi:**
- `frontend/src/assets/controllers/auth.controller.ts` → thêm `rememberMe?: boolean` param
- `frontend/src/pages/SignIn.tsx` → đọc giá trị toggle và truyền vào controller

#### A2: Thêm `trust proxy` + `getClientIP()` ✅

**Files đã thay đổi:**
- `backend/src/middleware/index.ts` → wire `trustProxy` vào `createMiddleware`
- `backend/src/index.ts` → `app.set('trust proxy', ...)` được áp dụng
- `packages/backend-core/src/utils/get-client-ip.ts` → **NEW** utility với proxy header priority chain
- `packages/backend-core/src/types/http.d.ts` → **NEW** IncomingHttpHeaders module augmentation
- `packages/backend-core/src/middleware/apply.ts` → wire `trustProxy` + `secureCookie` vào middleware

**Quyết định đã chọn:**
- `trustProxy` → configurable qua env var `TRUST_PROXY` (default `true`)
- `getClientIP()` → đặt trong `backend-core/src/utils/` để reusable

#### A3: Sửa cookie `secure` flag ✅

**Files đã thay đổi:**
- `packages/backend-core/src/utils/cookie.ts` → tất cả cookie setters nhận `secure` param
- `packages/backend-core/src/middleware/csrf.ts` → `setCsrf` refactored thành factory function
- Env var: `SECURE_COOKIE` (thay thế `COOKIE_SECURE`)

#### A4: Thêm `/signout-all` vào `ApiAuthRoutes` ✅

**File đã thay đổi:**
- `packages/shared/src/api-routes.ts` → thêm `signOutAll: "/signout-all"`

---

### Phase B: Fingerprint Client-Side (M3 scope)

#### B1: Frontend tạo fingerprint

**File cần tạo:**
- `packages/core/src/fingerprint/` hoặc `frontend/src/assets/fingerprint.ts`

**Cách tạo:**
- Hash SHA256 của `[userAgent, acceptLanguage, acceptEncoding, accept, screenResolution, timezone, platform]`
- Không dùng IP (client không biết IP thật của mình)
- Gửi qua custom header `x-device-fingerprint` (đã có trong `HttpHeader`)

**Tích hợp vào HTTP client** (`packages/core/src/http/client.ts`):
- `RequestBuilder` có thể tự động tính fingerprint và gắn header (giống cách đã làm với CSRF token)
- Hoặc: tạo fingerprint một lần khi app start và cache trong memory

#### B2: Backend verify fingerprint khi refresh

**File cần sửa:**
- `backend/src/services/auth.service.ts:refreshToken()` → so sánh fingerprint

**Logic:**
```
if (currentFingerprint !== storedFingerprint) {
  // OPTION A (strict): revoke all tokens → force re-login
  // OPTION B (lenient): log warning, update fingerprint, continue
  // OPTION C (balanced): if IP also changed → revoke; if only fingerprint changed → update
}
```

Khuyến nghị: **OPTION C** — chỉ revoke khi cả fingerprint VÀ IP cùng thay đổi (tránh false positive khi user update browser).

---

### Phase C: Privacy & Cookie Consent (M3/M4 scope)

#### C1: Cookie Consent Banner

**Component mới trong `frontend/src/components/`:**
- `CookieBanner/CookieBanner.tsx` — banner fixed bottom
- Sử dụng Nmx primitives: `NmxButton`, `NmxInlineAlert`
- CSS module riêng

**Flow:**
1. Check `localStorage.getItem("cookie-consent")`
2. Nếu chưa có → hiện banner
3. User chọn: "Accept All" / "Essential Only" / "Customize"
4. Lưu consent vào localStorage
5. Nếu "Essential Only" → không gửi fingerprint header

**i18n keys cần thêm:**
```json
{
  "cookie": {
    "banner": {
      "title": "...",
      "description": "...",
      "acceptAll": "...",
      "essentialOnly": "...",
      "customize": "..."
    }
  }
}
```

#### C2: Privacy Policy Page (static)

**File cần tạo:**
- `frontend/src/pages/Privacy.tsx` — trang tĩnh hiển thị privacy policy
- Route: `/privacy`

Không cần i18n cho privacy policy (nội dung pháp lý, không nên dịch tự động).

#### C3: Consent-Aware Fingerprinting

Logic trong HTTP client hoặc config:
```typescript
const consent = localStorage.getItem("cookie-consent")
if (consent === "essential-only") {
  // Không gửi fingerprint
}
```

---

### Phase D: GDPR Endpoints (M4 scope — thấp hơn vì self-hosted)

#### D1: Data Export

```
GET /api/user/export-data → trả về JSON với toàn bộ data của user
```

#### D2: Account Deletion

```
DELETE /api/user/delete-account → xóa user + toàn bộ data liên quan
```

Cả hai endpoint đều cần auth middleware.

---

## 5. Kiến Trúc Dự Kiến Sau Khi Implement (Phase B)

```
packages/core/src/
├── fingerprint/
│   ├── index.ts          # (NEW) generateFingerprint(), gets cached
│   └── types.ts
├── http/
│   └── client.ts         # (modified) auto-attach fingerprint header

packages/backend-core/src/
├── utils/
│   ├── cookie.ts         # ✅ DONE — secure flag added
│   ├── get-client-ip.ts  # ✅ DONE — getClientIP() với priority chain
│   └── fingerprint.ts    # (NEW) server-side fingerprint verify

backend/src/
├── index.ts              # ✅ DONE — trust proxy wired
├── services/
│   └── auth.service.ts   # (modified) fingerprint validation in refreshToken
├── routes/
│   └── auth.ts           # ✅ DONE — use getClientIP()
│   └── user.ts           # (NEW) data export, account deletion

frontend/src/
├── components/
│   ├── CookieBanner/
│   │   ├── CookieBanner.tsx     # (NEW)
│   │   ├── CookieBanner.scss    # (NEW)
│   │   └── index.ts
│   └── index.ts                 # (modified) re-export CookieBanner
├── pages/
│   └── Privacy.tsx              # (NEW)

packages/shared/src/
├── api-routes.ts                # ✅ DONE — signOutAll added
```

---

## 6. Quyết Định Cần Thảo Luận

| # | Vấn đề | Status | Options |
|---|--------|--------|---------|
| 1 | **Fingerprint verify khi refresh** | ✅ DONE (Option C) | A) Strict — revoke all nếu mismatch<br>B) Lenient — log + update<br>C) Balanced — revoke nếu cả IP + fingerprint đổi |
| 2 | **Nơi tạo fingerprint** | ✅ DONE | A) Client-side hash (hiện tại)<br>B) Server-side hash từ headers (reference plan) |
| 3 | **`trust proxy`** | ✅ DONE | Configurable qua env var `TRUST_PROXY` (default `true`) |
| 4 | **Privacy policy** | M4+ | A) Static page đơn giản<br>B) Đầy đủ GDPR-compliant |
| 5 | **Cookie consent** | M4+ | A) Cần cho self-hosted software?<br>B) Chỉ cần nếu publish ra EU |
| 6 | **Fingerprint trong JWT payload** | ✅ DONE | B) Chỉ lưu trong DB (hiện tại) — không nhúng vào JWT |

---

## 7. Tổng Kết

### ✅ Những gì đã hoàn thành (Phase A và B)
1. ~~Sửa `rememberMe` không hoạt động~~ → đã wired
2. ~~Sửa `cookieSecure` không được áp dụng~~ → đã fix secure flag
3. ~~Thêm `trust proxy` + `getClientIP()`~~ → đã implement
4. ~~Thêm `/signout-all` vào shared API routes~~ → đã thêm
5. ~~Frontend tạo + gửi fingerprint header~~ → đã implement (`generateFingerprint()`, `FingerprintComponents` interface)
6. ~~Backend verify fingerprint khi refresh~~ → đã implement (Option C balanced)

### 📋 Những gì có thể làm sau (M4+)
7. Cookie consent banner
8. Privacy policy page
9. GDPR endpoints (data export, account deletion)

---

### Kiến Trúc Dự Kiến Sau Khi Implement (Phase B)
