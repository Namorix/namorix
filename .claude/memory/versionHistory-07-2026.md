# Version History — July 2026

## 2026-07-01 — AuthService concurrency fix, NmxGrid wrapping fix, SCSS tweaks

| Package | Version | Changes |
|---------|---------|---------|
| @namorix/styles | 0.33.0 → 0.33.1 | MODIFIED: `icon-svg.scss` — tweaks. `package-center.scss` — AddonGrid layout adjustments. Theme CSS rebuilt. |
| @namorix/ui | 0.24.0 → 0.24.1 | MODIFIED: `NmxGrid.tsx` — `repeat(N, 1fr)` → `repeat(auto-fill, minmax(...))` để wrap items khi container hẹp. |
| frontend | 0.49.0 → 0.49.1 | MODIFIED: `AddonGrid.tsx` — wrapping fix. |
| Namorix.Server | 0.42.0 → 0.42.1 | MODIFIED: `Services/AuthService.cs` — `RevokeAllUserTokens` dùng `ExecuteDeleteAsync` thay vì `RemoveRange` + `SaveChangesAsync` để tránh `DbUpdateConcurrencyException` khi concurrent revoke. |
