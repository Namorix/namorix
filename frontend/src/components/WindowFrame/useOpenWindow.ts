import { useWindowsStore } from "../../stores"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"
import type { NmxIconSvgSymbol } from "@namorix/ui"
import type { WindowRectType } from "../../types/windowing"

const readDefaults = () => {
  const cs = getComputedStyle(document.documentElement)
  const parse = (prop: string, fallback: number) =>
    parseFloat(cs.getPropertyValue(prop)) || fallback

  return {
    defaultWidth: parse("--nmx-window-default-width", 800),
    defaultHeight: parse("--nmx-window-default-height", 500),
    minWidth: parse("--nmx-window-min-width", 400),
    minHeight: parse("--nmx-window-min-height", 300),
    margin: parse("--nmx-window-margin", 20),
    taskbarHeight: parse("--nmx-taskbar-height", 50),
  }
}

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max))

export const useOpenWindow = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  const maximizeWindow = useWindowsStore((state) => state.maximizeWindow)
  const initGeometry = useWindowGeometryStore((state) => state.initGeometry)
  const savePreMaximize = useWindowGeometryStore(
    (state) => state.savePreMaximize,
  )

  return (
    id: string,
    label: string,
    icon?: NmxIconSvgSymbol,
    originRect?: WindowRectType,
    addonWidth?: number,
    addonHeight?: number,
    preferFullSize?: boolean,
  ) => {
    const existingCount = useWindowsStore.getState().windows.length
    const winId = openWindow(id, label, icon)

    const {
      defaultWidth,
      defaultHeight,
      minWidth,
      minHeight,
      margin,
      taskbarHeight,
    } = readDefaults()

    const availableWidth = window.innerWidth
    const availableHeight = window.innerHeight - taskbarHeight

    const maxWidth =
      availableWidth < minWidth ? availableWidth : availableWidth - margin * 2
    const maxHeight =
      availableHeight < minHeight
        ? availableHeight
        : availableHeight - margin * 2

    const desireWidth = addonWidth ?? defaultWidth
    const desireHeight = addonHeight ?? defaultHeight

    const width = clamp(minWidth, desireWidth, maxWidth)
    const height = clamp(minHeight, desireHeight, maxHeight)

    const cascade = 24
    const maxOffset = Math.min(maxWidth - width, maxHeight - height, 200)

    const offset =
      existingCount === 0
        ? Math.round(Math.random() * maxOffset)
        : ((existingCount - 1) * cascade + 24) % (maxOffset || 1)

    const x = margin + offset
    const y = margin + offset

    initGeometry({
      id: winId,
      x,
      y,
      width,
      height,
      originRect,
    })

    if (preferFullSize) {
      savePreMaximize(winId, x, y, width, height)
      maximizeWindow(winId)
    }

    return winId
  }
}
