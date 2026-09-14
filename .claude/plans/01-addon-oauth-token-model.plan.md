---
name: "Addon OAuth — đổi sang JWT verify local + revoke theo user"
overview: "Thay token opaque tra DB bằng access token JWT RS256 (TTL 900s) đặt trong HttpOnly cookie để addon backend verify offline mỗi request; addon chỉ gọi desktop khi refresh hoặc nhận push revoke. Token scope theo (userId, clientId), logout desktop revoke thật refresh token trong DB và push `session-revoked {userId}` qua kênh gRPC sẵn có. Bỏ session row dài hạn ở addon."
todos: []
isProject: false
---

# Addon OAuth — JWT verify local + revoke theo user

> **Tiến độ:** Phase 0 (chốt DG1–DG9) ✅ · **Phase 0.5 hotfix bug sống ✅ 2026-09-14** · **Phase 1a (`UserId`) ✅ 2026-09-14** · **Phase 1b (signer + `GetJwks` + hardening cổng) ✅ 2026-09-14** · **Phase 1c (cấp JWT thay GUID) ✅ 2026-09-14** · **Phase 2 (revoke theo user + push `session-revoked`) ✅ 2026-09-14** · **Phase 3 (SDK verify JWT offline + token store mới) ✅ 2026-09-14** · **Phase 4 (`@namorix/core` — `useSessionGuard` trả identity) ✅ 2026-09-14** · **Phase 5 (addon adapter `namorix-scout`) ✅ 2026-09-14** · **Phase 6 (dọn dẹp & bảo mật + bump version) ✅ 2026-09-14 — kế hoạch hoàn tất**. Backend build sạch 3 project; frontend **chưa chạy `tsc`**; signer đã verify thật, phần cổng **chưa test runtime**, và **chưa mục nào chạy end-to-end** (scout đã adapt xong ở Phase 5, nhưng chưa lần nào chạy thật cả luồng).
>
> **DG1 đã chốt lại cuối ngày 2026-09-14:** khoá phát qua **gRPC `GetJwks`**, không HTTP; cổng hoạt động của addon là **trạng thái kênh gRPC**; bỏ cache đĩa. Plan đã sửa đồng bộ toàn bộ các mục phụ thuộc (Flow, DG7/DG8, Phase 1b/1c/2/3, Risks).
>
> **Định dạng khoá: ✅ CHỐT `PEM/SPKI`** trong `JwksResponse` (không dùng JWK `n`/`e`) — user chốt 2026-09-14, theo đề xuất.
>
> ⚠️ **Phase 1b gồm cả hardening cổng kênh — đã làm.** Đọc kỹ `AddonChannelClient.cs` thấy **4 lỗ độc lập** làm cổng `IsConnected` không đáng tin: chết im lặng (thiếu keepalive), `Cancelled` không reconnect (chết vĩnh viễn), stream kết thúc êm (cổng nói dối là còn sống). Đã bịt bằng keepalive ping + reconnect mọi nhánh + cờ `_streamUp` fail-closed + message `handshake`. Đây là điều kiện của chính DG1, **không** phải việc phụ. Chi tiết ở Phase 1b + Risks.

## Trạng thái hiện tại (đã đọc code, 2026-09-14)

> ⚠️ **Đây là baseline trước khi làm Phase 0.5/1/2/3 — không phải tình trạng hiện tại.** Phần này giữ nguyên để đối chiếu "trước/sau"; bảng "Kết quả thực tế" cuối mỗi phase mới là cái đúng. Vài chỗ dưới đây đã bị chính các phase thay (vd `AddonSession` không còn tồn tại, middleware không còn `catch (Exception)` trần, revoke đã theo user).

### Desktop (namorix)

| Thành phần | Hiện tại | File |
|---|---|---|
| Cấp token | Opaque `Guid.NewGuid().ToString("N")`, ghi row `OAuthTokens` | `Services/OAuthService.cs:75,125,208` |
| Verify | Tra DB (`ValidateTokenAsync`) | `OAuthService.cs:226` |
| TTL | access **1h** (`AddHours(1)`), refresh **30 ngày**, code **1 phút** | `OAuthService.cs:83,91,33` |
| Ký | Không có. Session JWT của desktop là **HS256** (`JwtConfig.Secret`), không liên quan addon | `Services/AuthService.cs:112` |
| Endpoints | `GET /api/oauth/authorize`, `POST /api/oauth/token`, `POST /api/oauth/token/refresh`, `POST /api/oauth/revoke`, `POST /api/oauth/register` | `Controllers/OAuthController.cs:19,48,98,122,132` |
| JWKS / introspect | **Không có** | — |
| Refresh token row | `OAuthRefreshToken { Id, ClientId, TokenHash, ExpiresAt, CreatedAt, Used }` — **thiếu `UserId`** | `Models/OAuthRefreshToken.cs` |
| Revoke | `RevokeTokenAsync` chỉ tra `OAuthTokens.TokenId`, bỏ qua `TokenTypeHint`, **không revoke được refresh token** | `OAuthService.cs:168` |
| Logout desktop | `Logout` revoke refresh token desktop; `LogoutAll` → `RevokeAllUserTokens`. **Không đụng `OAuthTokens`/`OAuthRefreshTokens`/addon** | `AuthController.cs:81,94` |
| Kênh gRPC | `Connect(stream AddonMessage) returns (stream ShellMessage)` + unary `ExchangeUserCode`, `RefreshUserToken` | `Protos/addon_channel.proto` |
| Push desktop→addon | Chỉ `config-update` | `Grpc/DesktopConfigMessage.cs:8`, `Services/Grpc/AddonChannelService.cs:34` |
| Revoke hiện tại | **Cắt stream** `channelManager.DisconnectAsync(addonId)` — giết machine channel, không per-user | `OAuthController.cs:127` |
| Recheck | Poll `IsAddonAuthorizedAsync` mỗi **5 phút** | `AddonChannelService.cs:152` |

### Addon SDK (`Namorix.Core`, addon ProjectReference vào)

> ⚠️ Snapshot dưới đây là **trước Phase 3**. Phase 3 đã thay: `AddonSession` → `AddonToken` (bỏ `EncryptedAccessToken`/`AccessTokenExpiresAt`), `IAddonSessionService` → `IAddonTokenStore`, cookie mang chính JWT thay vì session id, và bỏ claim `session_id`. Chi tiết ở mục "Kết quả thực tế" của Phase 3.

- ~~`AddonSession { Id, UserId, ClientId, EncryptedAccessToken, EncryptedRefreshToken, AccessTokenExpiresAt, RefreshTokenExpiresAt, CreatedAt, LastSeenAt }`~~ — `AddonSession/AddonSession.cs` (đã xoá)
- Token mã hoá bằng DataProtection keyring **của container addon** → desktop không đọc được.
- `AddonSessionMiddleware` mỗi request tra cookie `nmx_addon_session` → row DB; nếu access token hết hạn thì gọi gRPC `RefreshUserToken`, fail thì **xoá row** → 401.
- Cookie → claims `NameIdentifier`/`Name`/`session_id`/`client_id`.

### Frontend (`@namorix/core`)

- **PKCE browser đã bị xoá** ở commit `e6b6198`. `useSessionGuard` chỉ gọi `/api/oauth/status`, 401 → `window.location.replace("/api/oauth/login")`. Không có `code_verifier` ở đâu cả.
- `AddonSessionAuthService.BuildLoginUrlAsync` gửi `response_type=code`, `client_id`, `redirect_uri`, `state` — **không có** `code_challenge`/`code_challenge_method`/`scope`. → **Phase 3 đã gửi PKCE `S256`**; phần browser vẫn không đổi (verifier nằm ở backend addon, không xuống browser).
- Desktop `OAuthService:55` vẫn verify PKCE `S256` nếu có, nhưng nhánh này chết. → **Phase 3 làm nhánh này sống lại**.
- `useSessionGuard` chỉ trả `"loading" | "authenticated" | "unauthorized"` — **không có userId**.
- 401 ở addon: full-page redirect, không refresh tại chỗ.

### Vấn đề cần fix

1. **Addon sống vĩnh viễn sau logout.** Logout desktop không revoke gì của addon; addon tự refresh access token từ refresh token 30 ngày → user logout rồi addon vẫn phục vụ. Đây là bug gốc.
2. **Addon phải tra DB mỗi request** để validate cookie — không verify offline được vì token opaque.
3. **Revoke không theo user**: chỉ `DisconnectAsync(addonId)` — cắt cả addon, không nhắm 1 user trong addon nhiều user.
4. **Không revoke được refresh token** (`RevokeTokenAsync` chỉ tra `OAuthTokens`).
5. `RefreshAddonTokenAsync` cấp token **không set `UserId`** (mặc định 0) và gRPC `RefreshUserToken` không trả `user_id` → mọi thứ scope theo user sẽ sai nếu không fix trước. → **ĐÃ BỊT ở Phase 1a** (chưa verify runtime).
6. `redirect_uri` **không được validate** theo registration (`ValidateAuthorizationAsync` chỉ check `ClientId`+`PublicKey` non-null) → code theft / open redirect.
7. **Restart desktop → addon tự logout.** `AddonSessionMiddleware.cs:39-45` bắt `catch (Exception)` rồi `DeleteAsync(session)` — không phân biệt lỗi tạm (channel chưa start, `AddonChannelClient.cs:137`; gRPC `Unavailable`; desktop restart) với lỗi thật. Bất kỳ exception nào cũng xoá session → 401 → logout oan. **Bug sống, không liên quan JWT.** → **ĐÃ BỊT ở Phase 0.5.**
8. **Concurrent refresh → false theft → revoke cả client.** Refresh token có rotation (`OAuthService.cs:124`); reuse bị coi là trộm và revoke **theo `ClientId`** (`:109-122`) → đá **mọi user** của addon đó. `AddonSessionService` không có khoá nào (mỗi method mở DbContext riêng, `AddonSession` không có concurrency token) → N request song song cùng lúc token hết hạn là dính. **Bug sống, không liên quan JWT.** → **ĐÃ BỊT ở Phase 0.5.**

## Kiến trúc đích

```
FE addon ──HttpOnly cookie (access JWT RS256, 900s)──► BE addon
   │
   ├─ KÊNH ĐỨT ──► 503, nghỉ phục vụ (desktop chết = addon chết)
   ├─ kênh sống ──► verify chữ ký + exp local (CPU, no network, no DB; public key giữ trong RAM, lấy qua RPC GetJwks)
   ├─ exp quá ──► refresh server-side, single-flight theo user ──► desktop (chặn nếu session revoke)
   ├─ push `session-revoked {userId}` ──► xoá refresh token đúng user
   └─ gRPC reconnect ──► hỏi lại session nào còn valid, drop phần còn lại
```

Nguyên tắc:

- **Desktop chết → addon chết.** Không phục vụ khi không liên lạc được desktop: đây là ràng buộc bảo mật, không phải trade-off availability. Cổng là **trạng thái kênh gRPC**, một boolean sẵn có trong process.
- Token nằm trong **HttpOnly cookie** do addon BE set — FE **không cầm token**, JS không đọc được. Giữ nguyên principle "HttpOnly cookie for tokens" của dự án; khác hiện tại chỉ ở chỗ cookie mang JWT thay vì session id.
- Access token **self-contained** — addon verify **local** (crypto thuần, không tra DB/network mỗi request). Lý do tồn tại của verify local là **chi phí mỗi request**, không phải để sống sót khi desktop chết.
- Khoá công khai lấy qua **RPC `GetJwks` trên kênh gRPC sẵn có**, giữ trong **RAM** (không cache đĩa — kênh đứt thì addon cũng không phục vụ). Refetch khi gặp `kid` lạ.
- Addon **không giữ session row dài hạn**. Chỉ giữ **refresh token theo `(userId, clientId)`** để tự refresh.
- FE **không biết token tồn tại** → không token store, không retry 401, không logic refresh/redirect ở FE. Addon BE lo hết.
- Revoke latency bịt theo 4 lớp, **mạnh nhất đứng đầu**: kênh đứt (tức thời) → push (gần tức thời khi addon online) → reconnect re-check (bịt ca push miss) → TTL 900s là chốt chặn cuối cho token đã phát.
- Mọi grant/revoke scope theo **cặp `(userId, clientId)`**, không theo addon.

## Flow đích

**Login (lần đầu)**
1. FE addon gọi `/api/oauth/status` → 401 → redirect `/api/oauth/login`.
2. BE addon sinh PKCE verifier, giữ theo `state` (đang có sẵn `IMemoryCache key nmx:oauth:state:`), dựng authorize URL kèm `code_challenge` → 302.
3. Desktop: có session cookie thì skip nhập password → cấp `code` → 302 về `redirect_uri`.
4. BE addon `GET /api/oauth/callback` → verify `state` → gRPC `ExchangeUserCode(code, code_verifier, client_assertion, client_id)` → nhận `{access_token(JWT), refresh_token, expires_in, user_id}`.
5. BE addon **lưu refresh_token** theo `(userId, clientId)`, set **HttpOnly cookie** chứa access JWT, rồi redirect FE về app. FE không nhận token.

**Mỗi request**
6. Browser tự gắn cookie → BE addon **kiểm kênh gRPC trước**: kênh đứt → 503, nghỉ phục vụ (không verify bằng khoá RAM cũ). Kênh sống → verify chữ ký + `exp` local → set claims `userId`/`client_id`. Không gọi desktop, không tra DB, không network.

**Hết hạn / revoke**
7. `exp` quá → middleware refresh server-side qua gRPC `RefreshUserToken`, **single-flight theo `(userId, clientId)`** (N request song song chỉ refresh 1 lần), set cookie mới. **Đây là chỗ desktop chặn được nếu session gốc đã revoke.**
8. Refresh fail — **phải phân loại**:
   - `400 invalid_grant` (hết hạn / đã revoke) → xoá refresh token + cookie → 401 → FE redirect về bước 1. Đây là nhánh "refresh fail" duy nhất, không có nhánh lỗi riêng.
   - Lỗi **tạm thời** (timeout, desktop 5xx, desktop đang restart) → **giữ nguyên** refresh token, trả 503 để FE retry. **Không được coi transient là invalid_grant** — nếu không, một lần desktop reboot sẽ xoá sạch token và bắt user login lại dù chưa hề revoke.
9. Push `session-revoked {userId}` → BE addon xoá refresh token của đúng user đó ngay.
10. **Khi gRPC reconnect** → addon fetch lại JWKS (khoá có thể đã xoay) **và** hỏi lại desktop session nào của mình còn valid → drop phần còn lại. Bịt cửa sổ push-miss mà không cần hạ TTL.

## Cổng quyết định — đã chốt hết (2026-09-14)

| # | Gate | Lựa chọn | Khuyến nghị |
|---|------|----------|-------------|
| **DG1** | Khoá ký RS256 lưu ở đâu + **phân phối public key cho addon thế nào** | (a) file PEM; (b) entity cột `TEXT`; (c) DataProtection keyring | ✅ **Khoá: file PEM** (sinh khi chưa có, mode 600). ⚠ **Không** dùng `Setting.Value`: `MaxLength(100)` (`Models/Setting.cs:13`) → truncate PEM RSA 2048. Ghi qua `DataDirectory` (`Core/IO/DataDirectory.cs`, đã đăng ký singleton ở `Core/Extensions/ServiceCollectionExtensions.cs:43`) — không tự `File.*`. **Phân phối: RPC `GetJwks` qua gRPC** ⚠️ **đảo so với bản đầu** (bản đầu: HTTP `/.well-known/nmx-jwks`) — xem "DG1 chốt lại" ngay dưới bảng |
| **DG2** | Ai giữ `code_verifier` | (a) BE addon sinh + giữ theo `state`, desktop gửi `code_challenge`; (b) FE giữ trong `sessionStorage` | ✅ **CHỐT (a)** — ít hop, verifier không rời BE. `IMemoryCache` key `nmx:oauth:state:` đã có sẵn (`AddonSessionAuthService.cs:19,30,51`). PKCE là defense-in-depth bên cạnh `client_assertion` (private_key_jwt, verify ở `OAuthService.cs:241-275`): assertion xác thực *client*, PKCE buộc `code` với đúng phiên khởi tạo — rẻ nên giữ |
| **DG3** | FE giữ access token in-memory thì **reload mất** — bootstrap thế nào | (a) cookie bootstrap opaque + endpoint mint; (b) mỗi reload là silent login; (c) cookie HttpOnly | ✅ **Gate này biến mất** — vì DG4 chốt cookie nên token không rời BE, F5 không mất gì. Không cần bootstrap |
| **DG4** | Ai giữ token: Bearer in-memory hay HttpOnly cookie | (a) Bearer in-memory (FE cầm token); (b) **cookie HttpOnly mang JWT** | ✅ **CHỐT (b)**. Chỉ đổi *payload* cookie (session id → JWT), không đổi cơ chế. Giữ principle HttpOnly, không regression XSS, không sinh token store / 401-retry / redirect logic ở FE, không cần CORS preflight. Bearer chỉ đáng cân nhắc nếu có non-browser client gọi API addon (CLI, app riêng) — hiện chưa có |
| **DG5** | `OAuthRefreshToken` thiếu `UserId` + cột `Used` (rotation) | Thêm cột `UserId`; refresh token xoay vòng, dùng một lần | ✅ **Xoá sạch row cũ lúc migrate** (không backfill được; vốn đã là breaking change). **Reuse = theft**: refresh token đã `Used` mà bị dùng lại → revoke **cả chain** `(userId, clientId)`, không chỉ xoá 1 token. ⚠ **Cần grace/idempotency window (~10–30s)**: response refresh bị mất trên đường truyền, hoặc addon crash sau khi desktop đã rotate mà chưa kịp persist token mới → retry bằng token cũ. Single-flight **không** chặn ca này, nên nếu không có grace window thì "theft detection" tự tạo ra đúng cái logout oan mà nó định chống |
| **DG6** | Phạm vi revoke khi logout desktop | (a) mọi client của đúng user đó; (b) chỉ addon đang logout | ✅ **CHỐT (a) — user-scoped**. Tự làm một nhà, "logout là mất hết" đúng trực giác, chỉ cần cột `UserId`. Session-scoped (b) cần thêm `SessionId` trên grant + map `Logout`/`LogoutAll` riêng — chỉ đáng làm nếu sau này cần logout lẻ theo thiết bị |
| **DG7** | TTL | Access 900s (hiện 3600s); refresh giữ 30 ngày hay đổi 7/90 | ✅ **Access 900s** + reconnect re-check. Refresh giữ **30 ngày** như hiện tại — chưa có lý do đổi. ⚠️ **TTL không còn là trần revoke** theo DG1 chốt lại: lớp chặn mạnh nhất là **kênh đứt** (tức thời), TTL 900s chỉ còn là chốt chặn cuối cho token đã phát. Hạ TTL giờ **chỉ tốn** (refresh dày hơn, nhiều cơ hội trúng lỗi transient) chứ không mua được revoke nhanh hơn — muốn siết thì bịt bằng push + reconnect re-check |
| **DG8** | Có giữ bảng `OAuthTokens` làm whitelist không | (a) bỏ hẳn — chỉ kênh đứt + push + reconnect + TTL; (b) giữ row theo `jti` | ✅ **CHỐT (a) — bỏ khỏi verify path**. Whitelist vô nghĩa khi addon verify offline: không ai query nó mỗi request, giữ `Revoked` mà không ai đọc là dead weight. Revoke = **kênh đứt** (tức thời) + push + reconnect re-check + TTL 900s. Giữ bảng thuần cho **audit log** là use-case khác, không mâu thuẫn (tuỳ chọn) |
| **DG9** | Dữ liệu per-user ở addon | (a) chặn user thứ 2 tạm thời, owner column sau; (b) làm owner column luôn | ✅ **CHỐT (a)** — chặn multi-user ở tầng login tới khi `ScCamera` có `UserId`. Bật grant theo `(userId, clientId)` là **đã mở multi-user**, mà data còn global → user B thấy camera của user A: **rò rỉ dữ liệu**, không phải "tính năng làm sau". Là **nợ kỹ thuật có hạn** — TODO cụ thể ở Phase 5, không phải phase mơ hồ |

### DG1 — chốt lại lần cuối (2026-09-14, user chốt): phát JWKS qua gRPC + gate theo kênh

**Luật nền:** desktop là auth server duy nhất, **desktop chết thì addon phải chết theo** — không nhân nhượng vì availability, vì đây là chuyện bảo mật chứ không phải trade-off hiệu năng. Bản plan đầu chọn HTTP một phần vì muốn addon sống được khi desktop chết; bỏ giả định đó thì lý do đó rụng.

Hệ quả, ghi rõ để không ai "tối ưu" ngược lại:

1. **Bỏ endpoint HTTP `/.well-known/nmx-jwks`.** Khoá phát qua một RPC unary mới `GetJwks` trên chính `AddonChannel` (đã xác thực bằng machine token sẵn có). Lợi thật: khoá chỉ lấy được **khi kênh còn sống** — đúng bằng lúc addon được phép phục vụ; và **không mở thêm bề mặt anonymous** trên desktop. Không cần row `FgReverseProxyRules`, không cần controller `[Authorize]`-less.
2. **Bỏ cache đĩa.** Không cần: kênh đứt là addon nghỉ phục vụ, khoá giữ trong **RAM** là đủ. Vẫn cache RAM để khỏi hỏi lại mỗi request — chỉ fetch lại khi gặp `kid` lạ (xoay khoá).
3. **Gate = trạng thái kênh stream.** `AddonChannelClient` đã tự biết stream sống/chết (`ReceiveLoopAsync` bắt được đứt, `ReconnectAsync` thử lại mỗi 5s). Kênh đứt → middleware trả 503, **không** verify bằng khoá RAM cũ. Đây là một boolean trong process, **không** tốn lời gọi nào mỗi request.
4. **Verify local vẫn giữ, nhưng đổi lý do.** Không còn là "sống sót khi desktop chết" mà là **cắt chi phí mỗi request** (không tra DB/network mỗi lần). Đây là lý do duy nhất còn lại, và vẫn đủ mạnh.
5. **Revoke latency đổi trục.** Lớp chặn mạnh nhất giờ là **kênh đứt** (tức thời), không phải TTL. Thứ tự mới: kênh đứt → push `session-revoked` (user-scope) → reconnect re-check → TTL 900s chỉ còn là chốt chặn cuối cho token đã phát ra.
6. **Giá phải trả, chấp nhận có ý thức:** mỗi lần desktop restart/deploy → addon 503 suốt cửa sổ đó. **Không phải regression** — Phase 0.5 đã làm đúng vậy (transient → giữ session + 503).

⚠️ **Không** bỏ hết HTTP: `NmxOAuth2Client` + `DesktopApiUrl` vẫn phải giữ cho `/register` và `/token` (đăng ký machine token lúc cold start). Chỉ JWKS chuyển sang gRPC.

## Phases

### Phase 0 — Đã chốt hết DG1–DG9 (2026-09-14)
Không còn gate mở, shape API đã đứng yên. Riêng DG9 không biến mất mà chuyển thành **nợ kỹ thuật có hạn** ở Phase 5 (chặn multi-user cho tới khi `ScCamera` có owner).

**Thứ tự thực hiện: Phase 0.5 → Phase 1 → …** Lý do tách Phase 0.5 ra trước: hai bug ở đó có sẵn trong hệ opaque-token hiện tại, không liên quan JWT, và sẽ liên tục đá addon ra trong lúc restart desktop để test/deploy Phase 1–3.

### Phase 0.5 — Hotfix bug sống ✅ XONG 2026-09-14 (không đụng JWT, không đụng schema)
Hai bug ở mục 7–8 của "Vấn đề cần fix" **đang chảy máu ngay trong kiến trúc hiện tại**. Commit riêng (`fix(core):` / `fix(backend):`), **không** bump major. Không cần tách release riêng — chỉ cần ranh giới commit để deploy lẻ được.

**Thứ tự trong Phase 0.5: contract mã lỗi trước, vì 2 việc sau phụ thuộc vào nó.**

**Hợp đồng mã lỗi (quan trọng nhất — Phase 3 kế thừa nguyên, không viết lại):**
- `Unauthenticated` hiện mang ít nhất 3 nghĩa: machine token sai (`AddonChannelService.cs:19,138`), refresh token sai (`:119`), reuse/theft (`:123`). **Không** phân loại được bằng `StatusCode`, và tuyệt đối không so khớp chuỗi message.
- Phát mã riêng qua `RpcException.Trailers` (cơ chế native của gRPC): `invalid_client` (machine token), `invalid_grant` (refresh token sai/hết hạn), `theft_detected` (reuse). Dùng lại `OAuthErrors.InvalidClient`/`InvalidGrant` (`Constants/Error.cs:56-62`); thêm `theft_detected` mới. **Không** dùng `OAuthRefreshErrors.TokenReused` — đó là mã cho HTTP response, khác tầng.
- Đây là phần **không bỏ đi** khi Phase 3 viết lại middleware sang JWT cookie.

**1. `AddonChannelService`** — gắn trailer mã lỗi vào từng nhánh `RpcException`: `RequireAddonClientIdAsync` + `ExchangeUserCode` phát `invalid_client`; `RefreshUserToken` phát `invalid_grant` (status `Expired`) hoặc `theft_detected` (status `Reused`). Hiện cả 3 nhánh đều trả `Unauthenticated` trần (`:19,119,123,138`).

**2. `AddonSessionMiddleware`** — bỏ `catch (Exception)` trần, phân loại:
- `theft_detected` / `invalid_grant` → xoá session (hành vi đúng, giữ nguyên).
- Transient: `Unavailable`, `DeadlineExceeded`, `InvalidOperationException` "Channel not started" (`AddonChannelClient.cs:137`), timeout → **giữ session**, trả 503 để FE retry.
- Hệ quả: desktop restart không còn xoá session.

**3. `AddonSessionService`** — khoá per-session quanh thao tác refresh:
- `SemaphoreSlim` keyed theo `sessionId` (`ConcurrentDictionary`). **In-process lock** — comment rõ rằng nó vỡ nếu addon scale ngang; hiện addon là 1 container nên chấp nhận.
- **Double-check bên trong lock**: vào lock → `FindAsync` lại → nếu `AccessTokenExpiresAt > now` thì thoát (request khác đã refresh xong). **Thiếu bước này lock vô dụng** — request thứ hai vẫn cầm session cũ đã đọc trước đó, vẫn refresh bằng refresh token cũ, vẫn reuse.
- Cleanup entry khỏi dictionary khi không còn ai chờ, tránh phình theo số session từng tồn tại.
- Khoá theo `sessionId`, **không** global — mỗi user một session, refresh độc lập.

**Ghi chú cho người đọc sau:** phần lock là **công tạm** — Phase 3 viết lại middleware sang JWT cookie sẽ thay bằng lock per `(userId, clientId)` bao quanh cả network call + ghi DB. Phần phân loại + mã lỗi thì giữ. Nói rõ trong comment/commit để không ai refactor "cho đẹp" trước Phase 3.

#### Kết quả thực tế (2026-09-14) — build sạch, **chưa test runtime**

| File | Thay đổi |
|---|---|
| `Core/Constants/OAuth.cs` | Thêm `Trailer.ErrorCode = "nmx-error-code"` (khoá trailer dùng chung 2 phía) |
| `Core/Constants/Error.cs` | Thêm `OAuthErrors.TheftDetected = "theft_detected"` |
| `Server/Services/Grpc/AddonChannelService.cs` | Helper `Error(status, code, msg)` / `InvalidClient(msg)` gắn trailer; gắn vào 5 nhánh: `Connect` (missing/invalid machine token), `RequireAddonClientIdAsync` (3 nhánh), ClientId mismatch ở `ExchangeUserCode`/`RefreshUserToken` → `invalid_client` |
| `Core/AddonSession/AddonSessionMiddleware.cs` | Phân loại qua `IsFatalRefreshFailure`; `catch (Exception)` trần bị bỏ. Request bị abort → `return`; fatal → xoá session; còn lại → giữ session + 503 |
| `Core/AddonSession/AddonSessionLockRegistry.cs` (mới) | `SemaphoreSlim` per-key + refcount để dọn dictionary; comment ghi rõ in-process only |
| `Core/AddonSession/AddonSessionAuthService.cs` | `RefreshSessionAsync` lấy lock rồi `FindAsync` lại (double-check) — khoá bao **cả** network call **và** ghi DB |
| `Core/AddonSession/AddonSessionAuthExtensions.cs` | Đăng ký `AddonSessionLockRegistry` singleton |

**Lệch so với thiết kế trên (có chủ ý):**

1. **Lock đặt ở `AddonSessionAuthService.RefreshSessionAsync`, không phải `AddonSessionService`** — `AddonSessionService` chỉ là CRUD mở DbContext riêng từng method, không có chỗ nào bao được network call. Đặt ở tầng gọi refresh mới khoá trùm được cả network + ghi DB, đúng yêu cầu "double-check bên trong lock". `AddonSessionService` giữ nguyên không đổi.
2. **Sửa luôn nhánh `Expired` bị gộp nhầm vào theft.** Code cũ: `status == Reused || tokenId is null` → cùng một `RpcException` "possible theft". `Expired` (token không tồn tại/hết hạn) rơi vào `tokenId is null` → báo theft sai. Nay tách: `Reused` → `theft_detected`, `Expired`/`Ok` mà thiếu token → `invalid_grant`. Với middleware thì cả hai đều fatal, nhưng log/nhãn giờ đúng.
3. **`invalid_client` được xếp là TRANSIENT** (giữ session + 503), không phải fatal. Lý do: machine token hỏng là chuyện của *addon*, không phải session *user* — xoá session không sửa được gì mà còn đá user ra. Chỉ `theft_detected` + `invalid_grant` mới thật sự nghĩa là session đã chết.
4. `OAuthRefreshErrors.TokenReused` giữ nguyên, không dùng ở tầng gRPC (đúng như thiết kế).

**Chưa bịt:** ca response refresh bị mất / addon crash sau khi desktop đã rotate mà chưa persist (cần grace window ~10–30s) — vẫn nằm ở Phase 2 như cũ.

### Phase 1 — Desktop: cấp JWT RS256 + JWKS

**Thứ tự 1a → 1b → 1c.** Migration `OAuthRefreshToken.UserId` (DG5) được **kéo từ Phase 2 lên 1a** vì Phase 1c cần `UserId` để set vào JWT — nếu để ở Phase 2 thì Phase 1 phải cấp JWT với `sub = 0`. Phase 2 giữ lại phần *dùng* cột đó (revoke theo user + push).

**Phase 1a — `UserId` trên refresh token (mở khoá cho 1c)** ✅ **XONG 2026-09-14**

| File | Thay đổi |
|---|---|
| `Core/Models/OAuthRefreshToken.cs` | Thêm `UserId` (`init`), kèm comment lý do (DG6: revoke scope theo `(UserId, *)`) |
| `Server/Services/OAuthService.cs` | `ExchangeCodeAsync` set `UserId` cho row refresh token (`= authCode.UserId`); `RefreshAddonTokenAsync` set `UserId` cho **cả** `OAuthToken` **và** `OAuthRefreshToken` mới (`= stored.UserId`); tuple trả thêm `UserId`; 2 nhánh `Expired`/`Reused` trả `UserId = 0` |
| `Server/Controllers/OAuthController.cs` | Nhánh HTTP legacy `token/refresh` destructure 4 phần tử |
| `Server/Services/Grpc/AddonChannelService.cs` | `RefreshUserToken` điền `OAuthTokenResult.user_id` (trước bỏ trống → addon luôn nhận 0) |
| `Server/Migrations/20260914020654_AddOAuthRefreshTokenUserId.cs` | `AddColumn<int> UserId` trên `OAuthRefreshTokens`, `defaultValue: 0`; snapshot đã cập nhật (`AppDbContextModelSnapshot.cs:131`) |

**Quyết định về wipe row cũ:** plan ghi "xoá sạch row cũ lúc migrate", nhưng **không** nhét `DELETE` vào migration — **user đã truncate bảng `OAuthRefreshTokens` bằng tay** trước khi chạy `db-update`. Migration chỉ còn `AddColumn`. ⚠️ **Hệ quả còn treo:** instance/máy khác (nếu có) vẫn giữ row `UserId = 0` → revoke theo user sẽ không trúng ai. Muốn đóng hẳn thì phải truncate tay ở từng máy, hoặc thêm `Sql("DELETE FROM OAuthRefreshTokens;")` vào migration sau.

**Migration đã apply vào DB dev** (user chạy `make db-update`).

**Chưa verify runtime** — mới build sạch. Repo **không có test project** (`backend/**/*Test*.csproj` rỗng), nên bước "refresh xong `UserId` != 0" phải verify tay (login addon → refresh → soi row) hoặc dựng test project trước.

**Phase 1b — signer + phát khoá qua gRPC `GetJwks`** ✅ **XONG 2026-09-14**
- `Namorix.Server` — `Services/NmxAddonTokenSigner.cs`, namespace `Namorix.Server.Services` (⚠️ **không** đặt ở `Namorix.Core` như bản plan đầu, và **không** đặt trong folder/namespace `Services.OAuth` — namespace đó **che class `Namorix.Core.Constants.OAuth`** cho mọi file `Namorix.Server.Services.*`, vỡ ngay khi build; xem lệch #1 ở dưới): ký là việc **chỉ desktop** làm, mà `Namorix.Core` là SDK addon — ship code ký kèm private key cho addon là sai biên giới. Verifier + model JWKS mới thuộc Core (Phase 3). Cả 2 project đã có sẵn package `System.IdentityModel.Tokens.Jwt`.
  - Load/tạo RSA keypair, `Sign(userId, clientId, ttl)` → JWT (`iss`, `sub`=userId, `client_id`, `jti`, `iat`, `exp`), expose `kid`. Ký **RS256**. `kid` = thumbprint SHA-256 của public key (base64url), ổn định qua restart.
- Persist khoá qua `DataDirectory` (`Core/IO/DataDirectory.cs`): thêm `const OAuthSigningKeyFile = "oauth-signing.pem"`, ghi bằng `WriteFile` + set Unix mode 600 tay (class chưa có helper). Sinh khi chưa có. **Không** dùng `Setting.Value` (MaxLength 100 → truncate PEM).
- **Phát khoá: RPC unary mới `GetJwks` trên `AddonChannel`** ⚠️ **đảo so với bản đầu** (bản đầu: HTTP `GET /.well-known/nmx-jwks`).
  - `Core/Protos/addon_channel.proto` (nằm trong `Namorix.Core` nhưng **dùng chung**: Server implement, Core gọi): thêm `rpc GetJwks(JwksRequest) returns (JwksResponse)`; request rỗng; response mang danh sách `{kid, public key}` (hiện trả **đúng 1 key** — chưa có rotation, Phase 6; list chỉ để sẵn hình dạng).
  - Auth bằng đúng machine token sẵn có — `RequireAddonClientIdAsync` tái dùng. **Không** mở bề mặt anonymous nào trên desktop.
  - `Server/Services/Grpc/AddonChannelService.cs`: implement.
  - `Core/Grpc/AddonChannelClient.cs`: thêm `GetJwksAsync(ct)`.
  - **Không** thêm controller, **không** thêm path vào `Constants.OAuth`, **không** cần row `FgReverseProxyRules`. Ghi chú: `MapNmxOAuthConfig` (`Core/OAuth/NmxOAuthConfigEndpointExtensions.cs`) **không** revive — đó là discovery doc **phía addon**, khác hẳn JWKS **phía desktop**.
- **Định dạng khoá: ✅ CHỐT PEM (SPKI)**, không dùng JWK `n`/`e`. Addon là .NET (`RSA.ImportFromPem` có sẵn), chỉ desktop↔addon nói chuyện, transport là gRPC chứ không phải endpoint public → PEM rẻ và ít lỗi hơn base64url big-endian bignum. Đánh đổi chấp nhận: mất hình dạng "JWKS JSON chuẩn", nhưng không có consumer thứ ba nào cần nó. Đổi lại nếu sau này có client ngoài .NET thì phải thêm `n`/`e` (Phase 6 nếu cần).
- **Hardening cổng `IsConnected` — bắt buộc trong Phase 1b** ⚠️ **phát hiện khi đọc `AddonChannelClient.cs`; không có phần này thì luật nền DG1 sai trên thực tế.** Cổng hiện tại có **bốn** lỗ, không phải một:
  1. **Chết im lặng không phát hiện được.** `IsConnected => _call != null` (`:24`), mà stream chỉ ném exception khi có write fail hoặc peer đóng sạch. TCP half-open, desktop bị kill không sạch, desktop treo, mạng đứt → **không** ném lỗi; `SocketsHttpHandler` ở `:36` **không** cấu hình keepalive ping nào. Addon tưởng desktop sống, tiếp tục verify bằng khoá RAM và phục vụ. → **Bật HTTP/2 keepalive** (`KeepAlivePingDelay` + `KeepAlivePingTimeout`) để biến chết-im-lặng thành exception trong vài giây.
  2. **`Cancelled` không reconnect.** Nhánh `ex.StatusCode == StatusCode.Cancelled` (`:78-82`) chỉ `logger.LogWarning` + `_call = null`, **không** gọi `ReconnectAsync` — khác nhánh `catch (Exception)` bên dưới (`:83-93`) có reconnect. Trước DG1, addon mất kênh vẫn phục vụ được nên lỗi này vô hình; **giờ kênh là cổng**, nên một lần desktop chủ động cắt stream (hoặc bất kỳ `Cancelled` nào) là addon **chết vĩnh viễn cho tới khi restart process** — 503 mãi mãi. → Cho `Cancelled` đi chung đường reconnect với các lỗi khác, trừ khi `_lifetimeCt` đã cancel (shutdown thật).
  3. **Stream kết thúc bình thường để lại cổng "giả sống".** Nếu server đóng response stream một cách êm ái, `await foreach` (`:58`) **thoát bình thường** → rơi ra khỏi cả 3 nhánh catch → không set `_call = null`, **không** reconnect. Kết quả tệ nhất trong ba: `IsConnected` vẫn `true` trong khi thực tế không còn kênh → cổng **nói dối** đúng chiều nguy hiểm (cho phép phục vụ khi đã mất liên lạc). → Sau vòng lặp phải xử lý như mất kênh.
  4. **Bổ sung: `_call` được set ngay trong `StartAsync` (`:49`), trước khi kết nối thực sự thành lập** (gRPC connect lazy). Nên `IsConnected` nghĩa là "đã tạo call object", **không** phải "đang kết nối". → Thay bằng một cờ `_streamUp` chỉ bật sau tín hiệu sống đầu tiên (message đầu, hoặc handshake), và tắt ngay khi vòng lặp kết thúc vì bất kỳ lý do gì. Cổng phải **fail-closed**: chỉ `true` khi có bằng chứng sống.
- Kiểm chứng (repo chưa có test project, phải làm tay):
  - Ký rồi verify bằng public key ngoài tiến trình desktop.
  - **Test cổng:** SIGKILL desktop → đo thời gian tới khi addon trả 503. Phải là vài giây (keepalive), không phải "mãi mãi" hay "chỉ tới khi có request ghi".
  - **Test reconnect:** để desktop cắt stream êm → addon phải tự nối lại và phục vụ lại, không kẹt 503 vĩnh viễn.

#### Kết quả thực tế (2026-09-14) — build sạch 3 project, signer **đã verify**, cổng **chưa test runtime**

| File | Thay đổi |
|---|---|
| `Core/Constants/OAuth.cs` | Thêm `OAuth.AddonToken` = `Issuer = "namorix-desktop"`, `ClientIdClaim`, `SessionIdClaim` (chia sẻ với verifier Phase 3) |
| `Core/IO/DataDirectory.cs` | Thêm `const OAuthSigningKeyFile = "oauth-signing.pem"` |
| `Core/Protos/addon_channel.proto` | Thêm `rpc GetJwks(JwksRequest) returns (JwksResponse)` + `JwksRequest` (rỗng) + `JwksResponse { repeated AddonSigningKey keys }`, mỗi key `{ kid, public_key_pem }` |
| `Core/Grpc/DesktopConfigMessage.cs` | Thêm `TypeHandshake = "handshake"` + `Handshake()` |
| `Core/Grpc/AddonChannelClient.cs` | `IsConnected` → cờ `_streamUp` fail-closed; keepalive ping; `Cancelled` + stream-kết-thúc-êm đi chung đường reconnect; thêm `GetJwksAsync` |
| `Server/Services/NmxAddonTokenSigner.cs` (mới) | RS256, `kid` = SHA-256(SPKI) base64url, persist PEM qua `DataDirectory` + mode 600, sinh khi chưa có |
| `Server/Services/Grpc/AddonChannelService.cs` | Gửi handshake vô điều kiện trước config push; implement `GetJwks` |
| `Server/Program.cs` | `AddSingleton<NmxAddonTokenSigner>()` |

**Đã verify thật** (harness console tạm ở `/tmp`, reference thẳng assembly Server đã build, xong xoá — không thêm gì vào repo): `kid` có trong header, `alg` = RS256, `iss`/`sub`/`client_id`/`jti` đúng, lifetime khớp `ttl` truyền vào, file khoá tạo ra với mode `UserRead|UserWrite` (600), `kid` + PEM **ổn định qua 2 instance signer trên cùng thư mục** (tức sống qua restart), token do instance này ký verify được bằng PEM của instance kia, payload bị sửa → **bị từ chối**, keypair khác → `kid` khác và token **không** verify được.

**Lệch so với thiết kế trên (có chủ ý):**

1. **Signer nằm ở `Services/NmxAddonTokenSigner.cs` (namespace `Namorix.Server.Services`), KHÔNG phải `Services/OAuth/` như plan ghi.** Lý do cứng, do build phát hiện: đặt namespace `Namorix.Server.Services.OAuth` sẽ **che class `Namorix.Core.Constants.OAuth`** cho mọi file trong `Namorix.Server.Services.*` → `OAuth.Trailer` (`AddonChannelService.cs`) và `OAuth.NmxOAuth2Env` (`DockerService.cs`) vỡ ngay (CS0234). ⚠️ **Bài học: không được tạo folder/namespace tên `OAuth` dưới `Namorix.Server.Services`.**
2. **Thêm message `handshake` vào protocol** (plan chỉ ghi "message đầu, hoặc handshake"). Cổng mở **chỉ** khi nhận được nó, và server gửi nó **vô điều kiện, trước** config push. Lý do: nếu cổng mở theo "message đầu tiên bất kỳ" mà message đầu là config push best-effort (bị `catch` nuốt khi `settings.GetDesktopDomain()` ném), thì cổng **không bao giờ mở** → addon 503 vĩnh viễn dù mọi thứ khác khoẻ. Handshake tách khỏi mọi app logic nên là bằng chứng sống đáng tin.
3. **Claim name dùng const cục bộ (`"sub"`, `"jti"`, `"iat"`, `"kid"`), không dùng `JwtRegisteredClaimNames`.** Type đó **ambiguous** giữa `Microsoft.IdentityModel.JsonWebTokens` và `System.IdentityModel.Tokens.Jwt` (CS0104). Const cục bộ cũng đúng style repo (`JwtClaims`, `AddonToken.ClientIdClaim`).
4. **`_credentials` + `Lock` quanh lúc ký** — instance member của `RSA` không được document là thread-safe; phát token thưa nên lock gần như miễn phí.
5. **Ghi khoá bằng `DataDirectory.WriteFile` rồi chmod 600 ngay sau** → có cửa sổ rất ngắn file có thể đọc được theo umask. Chấp nhận trong data dir của chính desktop; `UnixCreateMode` sẽ bịt nhưng phải đi vòng qua `DataDirectory`.
6. **`JwksResponse.keys` là list nhưng hiện trả đúng 1 key.** Chưa làm rotation (Phase 6) — list chỉ để sẵn hình dạng, **không** có cơ chế xoay khoá giả.
7. **Không có consumer nào cho `IsConnected`/`Sign`/`GetJwksAsync` trong repo.** Cố ý: `IsConnected` chỉ được Phase 3 đọc; `Sign` chỉ được gọi ở **Phase 1c** (vì `RefreshUserToken`/`ExchangeUserCode` vẫn trả GUID + `ExpiresIn = 3600`). `Sign` nhận `ttl` làm tham số nên **không** tự quyết TTL — Phase 1c truyền const TTL duy nhất vào. Grep xác nhận `IsConnected` không có ai dùng trong repo (chỉ có `AddonChannelManager.IsConnected(addonId)` là type khác), nên đổi ngữ nghĩa là an toàn.

**Chưa verify runtime (cần desktop + addon chạy thật):** cổng `_streamUp` thực sự đóng khi desktop chết (SIGKILL → 503 trong vài giây nhờ keepalive), và reconnect sau khi desktop cắt stream êm. `GetJwks` trên kênh sống cũng chưa gọi thật lần nào.

**Phase 1c — cấp JWT thay GUID** ✅ **XONG 2026-09-14**
- `OAuthService.ExchangeCodeAsync` / `RefreshAddonTokenAsync` trả JWT thay GUID; TTL access 900s theo DG7.
- ✅ **Landmine TTL đã bịt.** Thực tế hardcode **6** chỗ, không phải **4** như plan đếm — plan bỏ sót 2 chỗ ở đường HTTP legacy: `AddonChannelService.cs` trả `ExpiresIn = 3600` ở **cả** `ExchangeUserCode` (~`:106`) **và** `RefreshUserToken` (~`:136`); `OAuthService.cs` đặt `ExpiresAt = DateTime.UtcNow.AddHours(1)` ở `:83` (exchange) và trong refresh (~`:132`). Addon lấy `expires_in` từ gRPC để quyết định lúc nào refresh. Nếu JWT sống 900s mà `expires_in` vẫn khai 3600 thì addon **tưởng token còn sống thêm 45 phút**, không refresh, và mọi request trong cửa sổ đó fail chữ ký/hết hạn → 401 hàng loạt. TTL phải có **một** nguồn (const trong `Constants.OAuth`), cả 6 chỗ đọc từ đó, và `expires_in` phải khớp `exp` của JWT. **Hai chỗ plan bỏ sót:** `OAuthController.cs:66` (`POST /api/oauth/token`, grant `authorization_code`) và `:120` (`POST /api/oauth/token/refresh`) — đường HTTP legacy, cũng trả `expires_in` cho addon. ⚠️ Còn `OAuthController.cs:89` + `OAuthService.cs:222` là TTL **của machine token** (`client_credentials`) — đường khác, **cố ý** giữ `3600`/`AddHours(1)`, không gộp const.
- ✅ **Chốt A (user chốt 2026-09-14): vẫn ghi row `OAuthTokens`, nhưng `TokenId` giờ LÀ chính JWT** — không phải GUID như trước. Cột `TokenId` nới `MaxLength` 200 → 1024 (`Models/OAuthToken.cs`). Row vẫn ngoài verify path (DG8), chờ Phase 6 dọn.

#### Kết quả thực tế (2026-09-14) — build sạch 3 project, **chưa test runtime**

| File | Thay đổi |
|---|---|
| `Core/Constants/OAuth.cs` | Thêm `AddonToken.AccessTokenTtlSeconds = 900` — nguồn duy nhất cho TTL access token addon |
| `Core/Models/OAuthToken.cs` | `TokenId` `MaxLength` 200 → **1024** + comment lý do |
| `Server/Services/OAuthService.cs` | Ctor nhận `NmxAddonTokenSigner`; `AccessTokenTtl` static readonly; `ExchangeCodeAsync` + `RefreshAddonTokenAsync` trả **JWT** (`signer.Sign(userId, clientId, ttl)`) thay GUID; `ExpiresAt` row đọc từ const |
| `Server/Services/Grpc/AddonChannelService.cs` | `ExpiresIn` ở `ExchangeUserCode` + `RefreshUserToken` → `OAuth.AddonToken.AccessTokenTtlSeconds` |
| `Server/Controllers/OAuthController.cs` | `ExpiresIn` ở `token` (authorization_code) + `token/refresh` → cùng const. Nhánh `client_credentials` (`:89`) **cố ý** giữ `3600` |
| `Server/Migrations/20260914025244_WidenOAuthTokenId.cs` (mới) | **Rỗng** — xem ghi chú dưới |

**⚠️ Phát hiện quan trọng — migration rỗng, và cột `TokenId` chưa bao giờ bị giới hạn 200:**

EF sinh migration **không có operation nào** cho thay đổi `MaxLength`. Nguyên nhân: với SQLite, cả 200 lẫn 1024 đều map thành `HasColumnType("TEXT")`, nên `MigrationsModelDiffer` so *store type* thấy y hệt → không có delta. Snapshot thì có ghi `HasMaxLength(1024)`.

Hệ quả, cần nhớ:

1. **`[MaxLength(200)]` cũ chưa từng chặn gì.** SQLite không enforce độ dài `TEXT`, và EF Core không chạy DataAnnotations validation trong `SaveChanges`. Tức là kể cả nhét JWT ~700 ký tự vào cột "200" thì vẫn **lưu được** — sợ "lỗi không lưu được" là lo sai stack. Đổi sang 1024 chủ yếu là **sửa model cho đúng sự thật**, không phải sửa schema.
2. **Vẫn phải giữ file migration rỗng.** Xoá nó thì EF revert snapshot về 200 → model (1024) lệch snapshot → `db.Database.Migrate()` ở `Program.cs:209` ném `PendingModelChangesWarning`. File rỗng tồn tại chỉ để **đẩy snapshot**.
3. **`make db-update` không bắt buộc** — `Up()` rỗng, không có gì để chạy. Chạy thì nó chỉ ghi 1 dòng vào `__EFMigrationsHistory`. Không chạy cũng không lệch.
4. Ước lượng độ dài JWT thật: header ~103 + payload ~255 + chữ ký 342 + 2 dấu chấm ≈ **~700 ký tự**. 1024 còn dư ~320, đủ cho claim `session_id` nếu Phase 2/3 thêm.

**Hệ quả hành vi cần biết:**

- `ExchangeCodeAsync` giờ trả JWT → `RevokeTokenAsync` (`FindAsync(tokenId)`) vẫn khớp vì row lưu **đúng chuỗi JWT** đó. Chọn A giữ được đường revoke-by-access-token; chọn B/C thì không.
- **Row cũ `UserId = 0`** (máy chưa truncate, xem Risks) giờ sinh JWT có `sub = "0"` — không chỉ revoke nhắm sai, mà `userId` addon đọc được cũng là 0.
- **Đã có sẵn, không phải do 1c:** `ValidateTokenAsync:235` chỉ tra `AddonInstallations` theo `ClientId` của row trong `OAuthTokens`, **không phân biệt grant**. Nên một access token user (giờ là JWT) vẫn được `Connect`/`RequireAddonClientIdAsync` chấp nhận như machine token. Trước 1c cũng vậy (GUID cũng nằm cùng bảng) — không phải lỗ mới, nhưng đáng ghi để Phase 2/6 siết.


### Phase 2 — Desktop: revoke theo user + push `session-revoked` ✅ XONG 2026-09-14
- ~~Migration `OAuthRefreshToken` + `UserId`~~ → **đã làm ở Phase 1a** (kéo lên vì 1c cần `UserId` để set `sub`). Phase 2 chỉ **dùng** cột đó; phần truncate row cũ vẫn treo ở máy chưa chạy (xem Risks).
- `RevokeTokenAsync` xử lý `token_type_hint == refresh_token`.
- **Reuse detection**: refresh token đã `Used` bị dùng lại → revoke cả chain `(userId, clientId)` + grace/idempotency window ~10–30s (trả lại **cùng** token mới) để không nổ nhầm khi response bị mất hoặc addon crash trước khi persist. Tái dùng logic revoke-theo-user của DG6.
- `AuthController.Logout`/`LogoutAll` → revoke refresh token addon của `(userId, *)` theo DG6.
- Proto: thêm `ShellMessage.type = "session-revoked"`, payload `{"userId":"..."}` (bắt buộc kèm userId — payload chung chung sẽ kill nhầm user khác).
- `AddonChannelManager`: broadcast theo `clientId` (mọi instance của client đó), thay vì/ngoài `DisconnectAsync(addonId)`.
- `OAuthController.Revoke` bỏ `DisconnectAsync`, chuyển sang push.

#### Kết quả thực tế (2026-09-14) — build sạch 3 project, **chưa test runtime**

User chốt cửa sổ grace theo hướng **lưu successor đã mã hoá** (không chọn phương án phát lại token mới / bỏ grace).

| Việc | Chỗ sửa |
|------|---------|
| Hằng số | `Constants/OAuth.cs`: `AddonToken.RefreshReuseGraceSeconds = 30`; +`OAuth.TokenTypeHint` (`access_token`/`refresh_token`) |
| Cột mới | `Models/OAuthRefreshToken.cs`: `ReplacedByAccessTokenId` (1024), `EncryptedReplacedRefreshToken` (500), `ReplacedAt` (nullable) — `set` chứ không `init` vì ghi lên row cũ đã tracked |
| Migration | `20260914031757_AddOAuthRefreshTokenRotationSuccessor` — **có delta thật** (3 AddColumn), **đã apply vào DB dev** (user chạy `make db-update`) |
| Grace window | `OAuthService.TryReadSuccessor` — chỉ trong 30s kể từ `ReplacedAt`; `CryptographicException` (key-ring xoay) → coi như mất successor, rơi xuống nhánh theft chứ không bịa token |
| Revoke chain | `OAuthService.RevokeChainAsync(userId, clientId)` — thay filter `ClientId` đơn thuần bằng `(UserId, ClientId)` theo DG6 |
| Revoke theo hint | `RevokeTokenAsync` thử đúng hint trước, **rồi thử cái còn lại** (hint chỉ là gợi ý); trả `OAuthRevokedGrant(AddonId, ClientId, UserId)` thay vì chỉ addonId |
| Revoke refresh token | `RevokeRefreshTokenAsync` gọi luôn `RevokeChainAsync` — nếu chỉ đánh dấu refresh token thì access token của nó vẫn sống hết TTL, vô nghĩa hoá endpoint revoke |
| Revoke theo user | `OAuthService.RevokeAddonTokensForUserAsync(userId)` — `(userId, *)`, mọi client |
| Push | `Grpc/SessionRevokedMessage.cs` (mới, ở **Core** vì Phase 3 cần parse ở addon) + `ShellMessage` comment trong proto; `AddonChannelManager.BroadcastToClientAsync(clientId, msg)` + `ChannelContext.ClientId` (lấy ở `AddonChannelService.Connect` qua `GetClientIdAsync`) |
| Nối dây | `OAuthController.Revoke` bỏ `DisconnectAsync` → push theo `ClientId`; `AuthController.Logout`/`LogoutAll` → `RevokeAddonSessionsAsync(await RevokeRefreshAndResolveUserIdAsync())` (revoke DB + broadcast toàn bộ, payload `userId` để addon tự lọc) |
| Chống revoke hụt | `AuthService.RevokeTokenByHash` → `Task<int?>` (trả owner của row); `AuthController.RevokeRefreshAndResolveUserIdAsync` — refresh cookie là nguồn userId, access cookie chỉ là fallback. `OAuthService.RevokeAccessTokenAsync` chain-revoke khi `UserId != 0` |

**Hai lỗ do Phase 2 tự lộ ra — đã đóng cùng ngày (2026-09-14), build sạch:**

1. **`AuthController.Logout` lấy `userId` từ access cookie.** Access token hết hạn (15 phút) thì `VerifyAccessToken` trả null → desktop refresh token bị revoke nhưng grant addon **sống sót**.
   → `AuthService.RevokeTokenByHash` đổi thành `Task<int?>`: trả `UserId` của row trước khi `Remove` (chỉ 1 caller nên đổi signature an toàn). Thêm `AuthController.RevokeRefreshAndResolveUserIdAsync()` — ưu tiên userId từ refresh cookie (credential sống 30 ngày, còn hiệu lực khi access đã hết hạn), fallback `ResolveUserId()` cho request không có refresh token. Cả `Logout` lẫn `LogoutAll` dùng chung helper; `LogoutAll` trước đó lấy userId từ access cookie nên cùng bug.
2. **`RevokeAccessTokenAsync` chỉ revoke đúng 1 access token**, không đụng refresh token → addon refresh lại là có access token mới, revoke thành vô nghĩa.
   → Thêm `if (token.UserId != 0) await RevokeChainAsync(token.UserId, token.ClientId);` trong `RevokeAccessTokenAsync`. Guard `UserId != 0` vì machine token (`client_credentials`) tạo row **không set `UserId`** → `0`, không có refresh chain nên revoke row là hết việc; row legacy cũng `UserId = 0` nên không bị chain-revoke — **no-regression** so với trước, và đã nằm trong Risks (truncate legacy trước khi bỏ bảng). **Không thêm cột `GrantType`**: DG8 chốt `OAuthTokens` bỏ khỏi verify path, chỉ giữ làm audit tới Phase 6 → cột phân loại cho bảng sắp chết là scaffolding vứt đi.

### Phase 3 — Addon SDK (`Namorix.Core`): verify local + token store mới ✅ XONG 2026-09-14
- `AddonSession/NmxAddonTokenValidator.cs` — verify RS256 bằng public key **cache RAM-only** (⚠️ **bản đầu ghi RAM + disk**; bỏ đĩa theo DG1 chốt lại: kênh đứt là addon nghỉ phục vụ, giữ khoá trên đĩa chỉ tạo cảm giác "sống sót khi desktop chết" mà luật nền đã cấm). Check `exp`/`iss`, trả `(userId, clientId)`. Khoá lấy qua **`AddonChannelClient.GetJwksAsync`** (gRPC, không phải `NmxOAuth2Client`/`DesktopApiUrl`), refetch khi gặp `kid` lạ.
- `AddonSessionMiddleware` → **đọc cookie HttpOnly mang JWT** (giữ cơ chế cookie hiện tại, chỉ đổi payload từ session id sang JWT). **Thứ tự bắt buộc: kiểm kênh TRƯỚC, verify chữ ký SAU.** Kênh đứt (`!channel.IsConnected`) → **503, không đọc cookie, không verify** — đây là cổng bảo mật, và nhờ đặt trước nên nó không tốn thêm gì mỗi request. Kênh sống → verify local → set claims. Không chuyển sang Bearer (DG4).
- ⚠️ Cổng chỉ đáng tin sau khi Phase 1b hardening xong (keepalive + reconnect cả nhánh `Cancelled` + xử lý kết thúc êm + cờ `_streamUp` fail-closed). Middleware phải đọc **cờ đó**, **không** đọc `_call != null`. Nếu Phase 1b chưa làm thì **không được** coi cổng này là đảm bảo bảo mật.
- **Refresh trong middleware, server-side**: `exp` quá → gRPC `RefreshUserToken`, set cookie mới. **Single-flight theo `(userId, clientId)` bao quanh CẢ network call + ghi DB token mới** — bắt buộc vì refresh token có rotation (`Used`): thiếu lock là **logout oan**, không chỉ là chậm.
- **Persist token mới trước khi trả response**: ghi `EncryptedRefreshToken` mới rồi mới set cookie/trả 200, tránh ca "đã rotate nhưng crash trước khi lưu".
- **Phân loại lỗi refresh**: chỉ `400 invalid_grant` mới xoá refresh token + cookie → 401. Timeout / desktop 5xx / desktop restart → giữ token, trả 503 để FE retry.
- Entity: bỏ `AddonSession`, thay `AddonToken { Id, UserId, ClientId, EncryptedRefreshToken, RefreshTokenExpiresAt, CreatedAt, LastSeenAt }` — bỏ `EncryptedAccessToken`/`AccessTokenExpiresAt` (không còn session dài hạn). Migration + đường chuyển cho row cũ (revoke sạch row cũ, mọi addon login lại).
- `AddonSessionAuthService`: `CompleteLoginAsync` thêm PKCE.
- `AddonSessionAuthController`: `/api/oauth/status` trả thêm `userId`.
- `AddonChannelClient.ReceiveLoopAsync`: handle `session-revoked` → xoá token record đúng `userId`.
- **Reconnect re-check**: khi kênh gRPC connect lại, hỏi desktop session nào của `(userId, *)` còn valid → drop phần còn lại. Bịt cửa sổ push-miss.

#### Kết quả thực tế (2026-09-14) — build sạch 3 project, **chưa test runtime**

| Việc | Chỗ sửa |
|------|---------|
| Entity | `AddonSession` → `AddonToken` (`Id, UserId, ClientId, EncryptedRefreshToken, RefreshTokenExpiresAt, CreatedAt, LastSeenAt`); bỏ `EncryptedAccessToken`/`AccessTokenExpiresAt`. Xoá `AddonSession.cs` |
| Ràng buộc | `AddonSessionDbContext.Tokens` + index unique `(ClientId, UserId)` — bất biến dài hạn. Chặn user thứ 2 là **rule tạm DG9 ở tầng app** (`AddonTokenStore.CreateAsync` trả `null`), không nhét vào schema vì Phase 5 sẽ gỡ |
| Store | `IAddonTokenStore`/`AddonTokenStore<TContext>` thay `IAddonSessionService` — thêm `DeleteMissingAsync`, `ListUserIdsAsync`; `FindAsync`/`DeleteAsync` khoá theo `(userId, clientId)` |
| Verifier | `NmxAddonTokenValidator` — RS256, key cache **RAM-only** (`Dictionary<kid, SecurityKey>`), `kid` lạ → `GetJwksAsync` refetch 1 lần; JWKS **thay cả cục** chứ không merge để key bị retire thôi verify |
| Ranh giới exp | `ValidateAsync` **không** enforce `exp` — trả `AddonTokenValidation(..., ExpiresAt, IsExpired)`. Phải nhận ra token "thật nhưng hết hạn" mới refresh được; `null` = không xác thực |
| Cổng | Middleware kiểm `channel.IsConnected` **trước khi đọc cookie**; đứt → 503, không verify gì |
| Claims | Bỏ `SessionIdClaim` (không còn session id); cookie mang chính JWT |
| Refresh | `AddonSessionAuthService.RefreshAsync(userId, clientId)` — lock `(clientId, userId)`, đọc token **trong lock**, `UpdateRefreshTokenAsync` **trước khi** trả JWT mới; trả `null` = grant đã chết |
| Cookie | `MaxAge = SessionTtlDays` (30 ngày) chứ không theo `exp` 900s — cookie phải sống lâu hơn JWT, nếu không hết 900s là mất luôn khả năng refresh |
| PKCE | `BuildLoginUrlAsync` sinh verifier → cache theo `state`, gửi `code_challenge`/`S256`; `CompleteLoginAsync` đọc verifier từ cache; `AddonChannelClient.ExchangeUserCodeAsync` thêm tham số `codeVerifier` (proto đã có field) |
| Revoke online | `AddonChannelClient.OnMessageAsync` (event mới, có I/O) + `AddonSessionChannelHandler : IHostedService` — `session-revoked` → xoá đúng `userId` |
| Reconnect re-check | Đổi từ "hỏi desktop" sang **desktop push `session-grants` mỗi lần connect** (`SessionGrantsMessage`, payload `{userIds}`): cùng kết quả, bớt 1 round-trip, và dùng lại đúng chỗ desktop đã push handshake/config-update. `AddonChannelClient.ActiveGrantUserIds` giữ list mới nhất để subscriber gắn muộn vẫn áp được |
| Phía desktop | `OAuthService.GetActiveGrantUserIdsAsync(clientId)` — refresh token `!Used && ExpiresAt > now && UserId > 0` (row legacy `UserId = 0` không phải grant của ai); `AddonChannelService.Connect` push ngay sau config-update, best-effort |
| Đã có sẵn | `/api/oauth/status` vốn đã trả `userId`; desktop đã nhận `code_challenge` từ trước — Phase 3 chỉ thiếu phía gửi |

**Quyết định & đánh đổi ghi lại:**
- `ActiveGrantUserIds == null` **khác** `== []`. `null` = chưa nhận được list (hoặc kênh vừa đứt) → không xoá gì; `[]` = desktop bảo "mày không còn grant nào" → xoá hết. Gộp hai cái là wipe sạch token vì một message không tới.
- Lock ở addon vẫn **in-process**, không dời sang desktop như bản plan đầu. Hai replica cùng refresh một grant vẫn có thể đụng nhau, nhưng grace window 30s của desktop đỡ được ca đó — nên không đáng thêm RPC.
- Refresh khi JWT hết hạn mà có 2 request song song cùng cookie cũ: request thứ hai vào lock sau, đọc refresh token **mới** (chưa dùng) nên xoay vòng lần nữa — **đúng**, chỉ tốn 1 rotation. Không dùng lại double-check kiểu cũ vì đã bỏ cột `AccessTokenExpiresAt`.
- Cửa sổ hẹp right after reconnect: handshake mở cổng trước khi `session-grants` tới, nên trong vài ms addon có thể phục vụ grant vừa bị revoke lúc offline. Đúng như plan đã chấp nhận — TTL 900s là chốt chặn cuối.
- `OAuthErrors.AccessDenied = "access_denied"` thêm mới, dùng cho ca DG9 chặn user thứ 2.

**Nợ đã biết:**
- ~~Endpoint `POST /api/oauth/logout` của addon chỉ xoá row cục bộ, **không** revoke grant phía desktop → grant cũ còn sống tới 30 ngày~~ ✅ **đã đóng 2026-09-14**, làm sớm so với Phase 6 — xem mục "Addon logout revoke grant" ngay dưới.
- `AddonSessionChannelHandler` là hosted service `AddonChannelClient` phụ thuộc — addon phải gọi `AddAddonChannelClient()` trước, đã ghi trong comment của `AddAddonSessionAuth`.
- Chưa test runtime: PKCE end-to-end, `kid` rotation, 503 khi SIGKILL desktop, reconnect + drop grant.

#### Addon logout revoke grant — việc Phase 6 làm sớm ✅ XONG 2026-09-14 (build sạch 3 project, **chưa test runtime**)

User chốt 2 điểm: **(1)** scope revoke là `(userId, clientId)` — logout addon A **không** đá user khỏi addon B; **(2)** kênh đứt thì **503, không cho logout** (không xoá cục bộ rồi để grant treo).

| Việc | Chỗ sửa |
|------|---------|
| RPC mới | `Protos/addon_channel.proto`: `RevokeGrant(RevokeGrantRequest) → RevokeGrantResponse` — RPC thứ 5 của kênh. Request **chỉ mang `user_id`**, cố ý **không** có `client_id` |
| Desktop | `OAuthService.RevokeGrantAsync(userId, clientId)` — bọc `RevokeChainAsync` (đang `private`), scope `(user, client)`; **idempotent**: grant đã chết vẫn trả success |
| gRPC server | `AddonChannelService.RevokeGrant` — `clientId` lấy từ `RequireAddonClientIdAsync` (machine token), **không** tin payload; chặn `user_id <= 0` (row backfill cũ thuộc về không ai) |
| Client | `AddonChannelClient.RevokeGrantAsync(userId, ct)` |
| Addon service | `AddonSessionAuthService.RevokeAsync` — lấy **cùng lease** `(clientId, userId)` với refresh; trả `false` khi desktop không tới được / từ chối |
| Controller | `AddonSessionAuthController.Logout` — revoke **trước**, desktop xác nhận rồi mới xoá row cục bộ + cookie; revoke thất bại → **503, không logout** |

**Ghi chú thiết kế:**
1. Lựa chọn (2) gần như miễn phí: cổng `!IsConnected → 503` nằm **đầu** `AddonSessionMiddleware` và **vô điều kiện**, nên kênh đứt thì request chưa tới controller đã 503. Code mới chỉ lo ca "desktop vẫn nối được nhưng từ chối".
2. Lock chung với refresh là **bắt buộc**, không phải tối ưu: một refresh đang bay có thể ghi row xoay mới lên desktop **sau** lệnh revoke → grant còn sống sau một logout báo thành công.
3. **Không** cần phân loại trailer `invalid_grant`/`theft_detected` như dự tính ban đầu — `RevokeGrant` idempotent nên ca "grant đã chết" không sinh mã lỗi nào.
4. **Không** push `session-revoked` ngược về addon sau khi revoke: addon đã tự xoá row, và nhiều replica của cùng addon dùng chung DB token (scout) nên không ai cần báo.

**Nợ còn lại:** lock vẫn **in-process** — 2 replica cùng lúc (một logout, một refresh) vẫn có thể để lại row desktop sống; addon thì đã logout nên chỉ còn row rác phía desktop. Chưa test runtime: kênh đứt → 503, desktop từ chối → 503, revoke thành công → row desktop chết.

### Phase 4 — `@namorix/core` (teo lại do DG4 chốt cookie) ✅ XONG 2026-09-14
- **Không** token store, **không** gắn `Authorization: Bearer`, **không** retry 401 ở FE — token không rời BE, addon BE lo toàn bộ. ✅ Đã kiểm tra `@namorix/core`: cả ba thứ này **không tồn tại sẵn** nên không phải xoá gì. (`http/authRefresh.ts` là refresh cookie của **desktop shell**, không liên quan addon.)
- `useSessionGuard`: expose `userId`/identity (lấy từ `/api/oauth/status`), không chỉ 3 trạng thái.
- Giữ nguyên nhánh redirect login khi `/api/oauth/status` trả 401.
- Bỏ hẳn tham chiếu PKCE đã xoá ở `e6b6198`; cập nhật `.claude/FLOW.md` (đang stale).

#### Kết quả thực tế (2026-09-14) — **chưa chạy `tsc`**, chưa test runtime

| Việc | Chỗ sửa |
|------|---------|
| Kiểu trả về | `SessionGuardResult { state: SessionGuardState; userId: number \| null }` (user chốt 2026-09-14) thay cho việc chỉ trả `SessionGuardState` — **breaking** với addon đang dùng hook |
| Lấy danh tính | Đọc `userId` từ body `/api/oauth/status` (`AddonSessionAuthController.Status` vốn đã trả `{ authenticated, userId }` → backend **không phải sửa**) |
| Body hỏng | `res.json()` lỗi → vẫn `authenticated` + `userId: null`, **không** đá addon ra; khớp hành vi `catch` cũ (desktop unreachable) |
| Widget mode | `!isStandalone` → `userId: null` (user chốt 2026-09-14): phiên thuộc desktop shell, addon không được đoán danh tính |
| 401 | Giữ nguyên `window.location.replace(loginUrl)` |
| Guard unmount | Thêm `if (cancelled) return` sau `await res.json()` để không set state sau unmount |
| Docs | `frontend/README.md`: bỏ "oauth (PKCE)" ở bảng deps; sửa ô Standalone auth (PKCE do **backend addon** lo, browser không thấy verifier); sửa dòng M4. `.claude/FLOW.md`: thêm `useSessionGuard()` vào bảng `hooks/` + đoạn "Phía frontend addon (Phase 4)" |

**Chưa kiểm chứng (không phải nợ):** chưa chạy `tsc -b`/build frontend để kiểm type — user chốt 2026-09-14 là **không cần**; chưa test runtime (widget → `userId: null`; standalone → `userId` đúng; 401 → redirect). Bump version `@namorix/core` (`0.67.4` → `0.68.0`) để ở Phase 6 như plan — ✅ xong 2026-09-14.

### Phase 5 — Addon adapter (repo `namorix-scout`) ✅ XONG 2026-09-14
- `ScoutDbContext`: bỏ `Sessions`, thêm `AddonToken`.
- `[RequireAuth]` / controllers đọc `userId` từ JWT claims.
- `Services/ScoutService.cs`: handle `session-revoked`.
- **DG9 — nợ kỹ thuật có hạn**: tạm **chặn grant thứ 2** khi đã có `AddonToken` của user khác → 403, kèm cảnh báo rõ trong README/code rằng addon hiện **single-user** (bật multi-user mà quên phần data là rò rỉ camera giữa các user). TODO cụ thể: thêm `UserId` trên `ScCamera` + filter mọi query theo user, rồi mới gỡ chặn.

#### Kết quả thực tế (2026-09-14) — backend build sạch 2 project, **chưa test runtime**

| Việc | Chỗ sửa |
|------|---------|
| Migration | `20260914090743_AddonTokenTable` — drop `Sessions`, tạo `Tokens` (`Id` int, `UserId`, `ClientId`, `EncryptedRefreshToken`, `RefreshTokenExpiresAt`, `CreatedAt`, `LastSeenAt`) + index unique `(ClientId, UserId)`. Row cũ **mất**, mọi addon phải login lại (đúng như plan Phase 3 đã chốt) |
| **Bug bắt được khi sinh migration** | `ScoutDbContext.OnModelCreating` **không** gọi `base.OnModelCreating` → index unique `(ClientId, UserId)` của `AddonSessionDbContext` bị **rơi im lặng**: override thay thế chứ không cộng dồn. Nghĩa là bất biến Phase 3 **chưa từng tồn tại** trong DB scout. Đã thêm `base.OnModelCreating(modelBuilder)` rồi sinh lại migration (lần sinh đầu không có index) |
| Adapter FE | `ScoutApp.tsx`: `guard === "loading"` → `guard.state === "loading"` (hệ quả breaking của Phase 4) |
| DG9 | Không phải viết thêm: `AddonTokenStore.CreateAsync` đã trả `null`, `CompleteLoginAsync` đã ném `AccessDenied`. Thêm comment cảnh báo single-user ở `ScoutDbContext` (scout **không có README** nào để ghi) |
| `ScoutService` handle `session-revoked` | **Không cần** — `AddonSessionChannelHandler` (do `AddAddonSessionAuth` đăng ký) đã lo cả `session-revoked` lẫn `session-grants`. Bullet này trong bản plan đầu đã lỗi thời |
| Controllers đọc `userId` từ claims | **Hoãn** — middleware đã set `ClaimTypes.NameIdentifier`, nhưng chỉ có nghĩa khi `ScCamera` có `UserId` + filter query, tức chính là TODO của DG9 |
| 400 → 403 | User chốt 2026-09-14: `AddonSessionAuthController.Callback` đổi `error=access_denied` → **403** (trước là 400 dùng chung cho mọi lỗi callback). Sửa ở **`Namorix.Core`** chứ không phải scout. `OAuthErrors.AccessDenied` chỉ có **đúng 1 chỗ** ném ra nên map thẳng là an toàn; lỗi callback còn lại vẫn 400 |

**Chưa kiểm chứng (không phải nợ):** chưa chạy `dotnet ef database update` (app tự `Migrate()` lúc start); chưa typecheck/build FE scout (`frontend/node_modules` không tồn tại, `tsc` cần cài deps trước); chưa test runtime (login → logout → revoke, chặn user thứ 2, migration trên DB có row cũ).

**Nợ kỹ thuật có hạn (DG9):** addon hiện **single-user** — `ScCamera` không có cột owner và mọi query không filter theo user. Bật multi-user mà quên phần data là **rò rỉ camera giữa các user**. TODO: thêm `UserId` trên `ScCamera` + filter mọi query theo user, rồi mới gỡ chặn ở `AddonTokenStore.CreateAsync`.

### Phase 6 — Dọn dẹp & bảo mật (2026-09-14)

- ~~Addon logout phải revoke grant phía desktop~~ ✅ xong sớm 2026-09-14 — xem mục "Addon logout revoke grant" cuối Phase 3.
- ✅ **Validate `redirect_uri` — chỉ kiểm hình dạng.** User chốt: desktop **không** biết trước origin của addon (frontgate gán host), nên chỉ chấp nhận `http`/`https`, không `Fragment`, `AbsolutePath == OAuth.AddonToken.CallbackPath`. `OAuth.AddonToken.CallbackPath` là hằng **dùng chung** (desktop chặn, SDK làm default `AddonSessionAuthOptions.CallbackPath`) để hai đầu không lệch. Thứ thật sự chặn code bị chuyển hướng là PKCE + client assertion, không phải check này — comment trong code ghi rõ.
- ✅ **Bỏ code legacy:** xoá action `POST /api/oauth/token/refresh` + `SetAddonRefreshTokenCookie`; `POST /api/oauth/token` giờ **chỉ** nhận `client_credentials` (nhánh `authorization_code` bỏ — code redeem qua gRPC `ExchangeUserCode`); xoá `Cookie.AddonRefreshToken`, `OAuthEndpoints.TokenRefresh`, các field `Code`/`CodeVerifier`/`ClientId` của `TokenRequest`.
- ✅ **Key rotation — chỉ docs (phương án A).** `backend/README.md` thêm mục "Addon signing key rotation": rotate **cứng**, backup file → stop desktop → xoá `oauth-signing.pem` → restart (tự sinh khoá mới) → xoá backup. Hệ quả ghi rõ: **mọi** addon session chết, user phải login lại. Chưa làm `kid` overlap.
- ✅ **DG9 giờ trả 403** (trước 400): `AddonSessionAuthController.Callback` phân biệt `access_denied` (request hiểu được nhưng bị từ chối) với phần còn lại (request sai/hết hạn).
- ✅ **Bump version 2026-09-14:** `Namorix.Core 0.64.0 → 0.65.0` (user chốt MINOR, **không** lên `1.0.0`), `Namorix.Server 0.82.0 → 0.83.0`, `@namorix/core 0.67.4 → 0.68.0` (bump trễ cho Phase 4). Đã cập nhật `progress.md`, `activeContext.md`, `FLOW.md`, `backend/README.md`. Ghi chú cho addon ngoài: kênh đã thêm RPC thứ 5 (`RevokeGrant`) — **additive**, call cũ không đổi, nhưng phải regenerate proto.

**Còn nợ sau Phase 6 (chưa xử lý):** `NmxOAuthConfigEndpointExtensions` + `OAuth.WellKnownPath` (discovery `/.well-known/nmx-oauth-config`) giờ trỏ tới `tokenUrl` không còn nhận `authorization_code` → đường chết; `AppConfig.OAuthRefreshTokenTtlDays` (mặc định 1, `appsettings.json`) không còn ai đọc — TTL refresh của desktop hardcode `AddDays(30)` trong `OAuthService`.

## Rủi ro

| Rủi ro | Mức | Xử lý |
|---|---|---|
| Lỗi **tạm** (desktop restart, channel chưa start, timeout) bị xử như lỗi thật → xoá session → **logout oan** | ~~Cao~~ **đã bịt** | ✅ Phase 0.5: bỏ `catch (Exception)` trần, phân loại qua trailer mã lỗi; transient giữ session, trả 503. Phase 3 kế thừa nguyên contract |
| **Thiếu single-flight** + rotation → 2 request song song cùng refresh, cái sau dùng token đã `Used` → coi là theft → revoke chain → **logout oan**. Bug tính đúng đắn, không phải performance | ~~Cao~~ **đã bịt** | ✅ Phase 0.5: lock per-session. ✅ Phase 3: lock per `(clientId, userId)` trong `AddonSessionAuthService.RefreshAsync`, đọc refresh token **trong lock**, persist trước khi trả JWT mới; contract mã lỗi giữ nguyên. Lock vẫn **in-process** — 2 replica addon cùng refresh một grant vẫn có thể đụng, nhưng grace 30s ở desktop đỡ được ca đó |
| Reuse detection báo nhầm khi response refresh bị mất, hoặc addon crash sau khi desktop đã rotate mà chưa persist token mới → revoke chain oan | ~~Cao~~ **đã bịt** | ✅ Phase 2: grace window 30s (`AddonToken.RefreshReuseGraceSeconds`) — desktop giữ successor đã mã hoá trên row vừa bị tiêu, replay trong cửa sổ trả lại **cùng** token mới thay vì coi là theft. ✅ Phase 3 phía addon: `UpdateRefreshTokenAsync` chạy **trước** khi trả response, nên ca "crash trước khi persist" không còn xảy ra |
| `RefreshAddonTokenAsync` cấp token `UserId = 0` → revoke theo user nhắm sai | ~~Cao~~ **đã bịt** | ✅ Phase 1a: set `UserId = stored.UserId` cho **cả** `OAuthToken` và `OAuthRefreshToken` mới; gRPC `RefreshUserToken` trả `user_id`. ⚠️ **chưa verify runtime** — repo không có test project nên phải soi row bằng tay. ⚠️ Phase 1c thêm hệ quả: row cũ `UserId = 0` giờ sinh JWT `sub = "0"`, nên `userId` addon nhận cũng sai, không chỉ revoke nhắm sai |
| Push miss khi addon offline | Thấp | Bịt theo 4 lớp, mạnh nhất đứng đầu: **kênh đứt** (tức thời) → push (addon online) → reconnect re-check (addon down) → TTL 900s là chốt chặn cuối. Cửa sổ hẹp hơn TTL nhiều vì addon down thì không phục vụ ai. ✅ Phase 3 làm lớp 3 thành thật: desktop push `session-grants` mỗi lần connect, addon `DeleteMissingAsync`. ⚠️ Còn cửa sổ vài ms sau `handshake` — handshake mở cổng trước khi list tới, nên grant bị revoke lúc offline có thể được phục vụ trong khoảng đó; TTL 900s là chốt cuối, đúng như đã chấp nhận |
| **Cổng kênh không đáng tin** (mới phát hiện khi đọc `AddonChannelClient.cs`) — 4 lỗ độc lập, cộng lại phá đúng luật nền DG1: (1) chết im lặng (half-open/kill không sạch/treo) không ném exception vì không có keepalive ping; (2) nhánh `StatusCode.Cancelled` set `_call = null` **mà không reconnect** → addon chết vĩnh viễn tới khi restart process; (3) stream kết thúc êm → thoát khỏi mọi catch, `_call` giữ nguyên → **cổng nói dối là còn sống** trong khi đã mất kênh | ~~Cao~~ **đã code, chưa test runtime** | ✅ Phase 1b: keepalive ping; `Cancelled` + kết thúc êm đi chung đường reconnect (trừ shutdown thật); `IsConnected` → cờ `_streamUp` **fail-closed**, mở chỉ khi nhận `handshake`. ⚠️ **Chưa chạy thật lần nào** — test tay còn nợ: SIGKILL desktop → 503 trong vài giây; cắt stream êm → addon tự nối lại |
| Revoke theo user dựa vào `OAuthRefreshToken.UserId`; row cũ `UserId = 0` (máy khác chưa truncate) → revoke không trúng ai | Trung bình | Phase 1a mới chỉ `AddColumn`; user đã truncate tay trên DB dev. Máy/instance khác phải truncate tay, hoặc thêm `Sql("DELETE FROM OAuthRefreshTokens;")` vào migration sau |
| Addon tách FE sang origin khác BE → cookie không tự gắn | Thấp | Hiện FE+BE cùng origin (cookie `nmx_addon_session` đang chạy). Addon nào tách origin thì phải tính lại (Bearer + CORS) |
| Breaking cho mọi addon ngoài (khác scout) | Trung bình | ✅ Phase 3 đã gây break: xoá `AddonSession`/`IAddonSessionService`, thêm `AddonToken`/`IAddonTokenStore`, `AddonSessionDbContext.Sessions` → `.Tokens` (+ index unique `(ClientId, UserId)`), bỏ claim `session_id`. Addon phải viết migration riêng (Phase 5). Bump `Namorix.Core` để ở Phase 6 — ✅ xong 2026-09-14: `0.64.0 → 0.65.0` (user chốt MINOR, **không** lên `1.0.0`). ✅ Phase 4 thêm break phía FE: `useSessionGuard` đổi kiểu trả về từ `SessionGuardState` sang `SessionGuardResult { state, userId }` — addon đang destructure state kiểu cũ phải sửa |
| Logout addon bị **503 khi desktop từ chối** → user kẹt, không đăng xuất được cho tới khi desktop chịu revoke | Thấp | Cố ý theo lựa chọn (2) của user 2026-09-14: thà kẹt logout còn hơn báo "đã đăng xuất" trong khi grant bên desktop vẫn refresh được tới 30 ngày. FE addon phải hiện lỗi + cho bấm lại, **không** tự xoá cookie |

## Không nằm trong phạm vi

- Multi-tenant dữ liệu ở addon (DG9) — chặn tạm ở Phase 5; owner column trên `ScCamera` là TODO riêng.
- `client_credentials` machine token của addon (dùng cho kênh gRPC) — giữ nguyên.
- Session JWT HS256 của desktop — giữ nguyên, không gộp với khoá RS256 của addon.
