# Rule 4: React Component Rules

```typescript
// ✅ Correct — named export
const WindowTitleBar: React.FC<WindowTitleBarProps> = ({ windowId, title, onClose }) => {
  const { focusWindow } = useWindowsStore()
  // ...
}

// ❌ Wrong — no default export for component
export default function WindowTitleBar() {}
```

## File Naming
- **PascalCase** for component files: `WindowTitleBar.tsx`
- **camelCase** for non-component files: `useWindowState.ts`

## Hooks Naming
- Pattern: `use{Resource}` or `use{Action}`
- Examples: `useAuthStore`, `useWindowsStore`, `useAddonsStore`

## Store (Zustand) Pattern
- File: `{name}.store.ts`
- Export hook: `const use{Name}Store = create<{Name}State>()((set, get) => ({...}))`
