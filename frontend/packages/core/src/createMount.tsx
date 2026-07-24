import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { AddonModeProvider } from "./host"

export function createMount(
  Component: React.ComponentType<object>,
): (container: HTMLElement, context?: { mode?: string }) => () => void {
  const rootMap = new WeakMap<HTMLElement, Root>()
  return (container: HTMLElement, context?: { mode?: string }) => {
    const root = createRoot(container)
    rootMap.set(container, root)
    root.render(
      <AddonModeProvider
        value={context?.mode === "widget" ? "widget" : "standalone"}
      >
        <Component />
      </AddonModeProvider>,
    )
    return () => {
      root.unmount()
      rootMap.delete(container)
    }
  }
}
