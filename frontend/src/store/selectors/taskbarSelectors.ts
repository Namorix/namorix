import type { WindowId } from "../types"
import type { RootState } from "../index"

export const selectorAppRect = (id: WindowId) => (state: RootState) =>
  state.taskbar.appRects[id] ?? null

export const selectorTaskbarOrder = (state: RootState) =>
  state.windowsState.order

export const selectorTaskbarButtonData =
  (id: WindowId) => (state: RootState) => {
    const win = state.windowsState.byId[id]
    if (!win) {
      return null
    }

    return {
      id: win.id,
      icon: win.item.icon,
      title: win.item.displayName,
      isActive: win.id === state.windowsState.activeId,
    }
  }
