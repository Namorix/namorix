import { createCssVariableCache } from "@namorix/ui"

type WindowDefaults = {
  defaultWidth: number
  defaultHeight: number
  minWidth: number
  minHeight: number
  margin: number
  taskbarHeight: number
  dragMinVisible: number
  dragThreshold: number
  titleBarCursorOffset: number
  cascadeStep: number
  cascadeMaxOffset: number
}

const WINDOW_DEFAULTS = {
  defaultWidth: ["--nmx-window-default-width", 800],
  defaultHeight: ["--nmx-window-default-height", 500],
  minWidth: ["--nmx-window-min-width", 400],
  minHeight: ["--nmx-window-min-height", 300],
  margin: ["--nmx-window-margin", 20],
  taskbarHeight: ["--nmx-window-taskbar-height", 50],
  dragMinVisible: ["--nmx-window-drag-min-visible", 150],
  dragThreshold: ["--nmx-window-drag-threshold", 30],
  titleBarCursorOffset: ["--nmx-window-titlebar-cursor-offset", 8],
  cascadeStep: ["--nmx-window-cascade-step", 24],
  cascadeMaxOffset: ["--nmx-window-cascade-max-offset", 200],
} as const satisfies Record<keyof WindowDefaults, [string, number]>

const windowCache = createCssVariableCache<WindowDefaults>(WINDOW_DEFAULTS)

export const getWindowDefaults = () => windowCache.get()
export const invalidateWindowDefaults = () => windowCache.invalidate()
