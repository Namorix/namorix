# Meta Rules

Discovered patterns, user preferences, and key insights.

## Skip LICENSE File
Do not read file `LICENSE` — it's GPLv3 license text, not needed for development tasks.

## Version Notation
Use Semantic Versioning `MAJOR.MINOR.PATCH` (no leading `v`).
Examples: `0.8.0`, `0.9.0`, `1.0.0`

If only major/minor known: set `PATCH = 0` (e.g. legacy `v0.8` → `0.8.0`)

## Symbol.for() for Decorator Metadata
Use `Symbol.for()` for metadata keys because decorators and `registerController` are in separate modules.
`Symbol("nmx:routes")` would NOT match `Symbol.for("nmx:routes")`.

## Giao Tiếp Bằng Tiếng Việt
Luôn giao tiếp với người dùng bằng tiếng Việt. Tất cả phản hồi, giải thích, câu hỏi đều dùng tiếng Việt.

## Root Version Bump Triggers
| Bump | When |
|------|------|
| PATCH | Bug fixes, config tweaks, dependency updates (any package) |
| MINOR | New feature, new package, milestone completion, workspace structure change |
