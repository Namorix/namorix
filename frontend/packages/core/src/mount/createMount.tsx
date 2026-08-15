import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { AddonModeProvider } from "./host"

export interface CreateMountContext {
  mode?: string
}

export function createMount(
  Component: React.ComponentType<object>,
): (
  container: HTMLElement,
  context?: CreateMountContext,
) => Promise<() => void> {
  const rootMap = new WeakMap<HTMLElement, Root>()

  return async (container: HTMLElement, context?: CreateMountContext) => {
    const isStandalone = context?.mode !== "widget"
    const root = createRoot(container)
    rootMap.set(container, root)
    root.render(
      <AddonModeProvider value={isStandalone ? "standalone" : "widget"}>
        <Component />
      </AddonModeProvider>,
    )
    return () => {
      const mounted = rootMap.get(container)
      if (mounted) {
        mounted.unmount()
        rootMap.delete(container)
      }
    }
  }
}
