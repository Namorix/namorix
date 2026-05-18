import { useWindowsStore } from "../../stores"
import { useWindowGeometryStore } from "../../stores/windowGeometry.store"
import type { NmxIconSvgSymbol } from "@namorix/ui"

export const useOpenWindow = () => {
  const openWindow = useWindowsStore((state) => state.openWindow)
  const initGeometry = useWindowGeometryStore((state) => state.initGeometry)

  return (id: string, label: string, icon?: NmxIconSvgSymbol) => {
    const existingCount = useWindowsStore.getState().windows.length
    const winId = openWindow(id, label, icon)

    initGeometry({
      id: winId,
      x: 50 + existingCount * 30,
      y: 50 + existingCount * 30,
      width: 800,
      height: 500,
    })

    return winId
  }
}
