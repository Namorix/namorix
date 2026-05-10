# Rule 5: UI Primitives (`@namorix/ui`)

## Naming Convention

| Element | Pattern | Example |
|---------|---------|---------|
| Component | `Nmx` prefix + PascalCase | `NmxButton`, `NmxInput` |
| Props interface | `[ComponentName]Props` | `NmxButtonProps`, `NmxInputProps` |
| CSS class | `nmx-kebab-case` BEM | `nmx-button`, `nmx-button--primary` |

## Component Structure
```
packages/ui/src/
├── Button/
│   ├── NmxButton.tsx
│   ├── NmxButton.module.scss
│   └── index.ts
├── Input/
│   ├── NmxInput.tsx
│   ├── NmxInput.module.scss
│   └── index.ts
└── index.ts    # barrel export
```

## Component Rules
- Functional components only (no class components)
- Props must have explicit TypeScript interface
- No inline styles — all styling via SCSS module
- No hardcoded colors or spacing — use `--nmx-*` CSS variables from `@namorix/styles`
- Export named from `index.ts`

## Usage
```tsx
import { NmxButton } from "@namorix/ui"
import "@namorix/styles"

const MyComponent = () => (
  <NmxButton variant="primary" onClick={handleClick}>
    Submit
  </NmxButton>
)
```

## SCSS Tokens from `@namorix/styles`
```scss
@use "@namorix/styles";

.nmx-button {
  padding: var(--nmx-spacing-2) var(--nmx-spacing-4);
  border-radius: var(--nmx-radius-md);
  background-color: var(--nmx-color-primary);
  color: var(--nmx-color-white);
  font-family: var(--nmx-font-sans);
}
```
