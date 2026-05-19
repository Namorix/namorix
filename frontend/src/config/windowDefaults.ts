interface WindowDefaults {
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

let _cache: WindowDefaults | null = null
const cache = {
  get(): WindowDefaults {
    if (_cache) {
      return _cache
    }

    const cs = getComputedStyle(document.documentElement)

    _cache = Object.fromEntries(
      Object.entries(WINDOW_DEFAULTS).map(([key, [prop, fallback]]) => [
        key,
        parseFloat(cs.getPropertyValue(prop)) || fallback,
      ]),
    ) as unknown as WindowDefaults

    return _cache
  },

  invalidate() {
    _cache = null
  },
}

export const getWindowDefaults = () => cache.get()
export const invalidateWindowDefaults = () => cache.invalidate()
