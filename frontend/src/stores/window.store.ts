import { create, type StateCreator } from "zustand"
import type { WindowId, WindowState } from "../types"

interface WindowsState {
  windows: WindowState[]
  activeId: WindowId | null
  nextZIndex: number

  openWindow: (app: string, title: string) => WindowId
  closeWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  maximizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
  moveWindow: (id: WindowId, x: number, y: number) => void
  resizeWindow: (id: WindowId, width: number, height: number) => void
}

let _idCounter = 0

const updateWindow = (
  windows: WindowState[],
  id: WindowId,
  patch: Partial<WindowState>,
) => {
  return windows.map((window) =>
    window.id === id ? { ...window, ...patch } : window,
  )
}

const windowsStore: StateCreator<WindowsState> = (setState, getState) => ({
  windows: [],
  activeId: null,
  nextZIndex: 1,

  openWindow(app, title): WindowId {
    const id = `win-${Date.now()}-${++_idCounter}`
    const { nextZIndex, windows } = getState()

    const win: WindowState = {
      id,
      app,
      title,
      x: 50 + windows.length * 30,
      y: 50 + windows.length * 30,
      width: 800,
      height: 500,
      minimized: false,
      maximized: false,
      zIndex: nextZIndex,
    }

    setState((state) => ({
      windows: [...state.windows, win],
      activeId: id,
      nextZIndex: state.nextZIndex + 1,
    }))

    return id
  },

  closeWindow(id) {
    setState((state) => {
      const remaining = state.windows.filter((win) => win.id !== id)

      const topWindow =
        remaining.length > 0
          ? remaining.sort((a, b) => b.zIndex - a.zIndex)[0]
          : null

      return {
        windows: remaining,
        activeId:
          state.activeId === id ? (topWindow?.id ?? null) : state.activeId,
      }
    })
  },

  focusWindow(id) {
    setState((state) => {
      const exists = state.windows.some((window) => window.id === id)
      if (!exists) {
        return state
      }

      return {
        windows: updateWindow(state.windows, id, {
          minimized: false,
          zIndex: state.nextZIndex,
        }),
        activeId: id,
        nextZIndex: state.nextZIndex + 1,
      }
    })
  },

  minimizeWindow: (id) =>
    setState((state) => ({
      windows: updateWindow(state.windows, id, { minimized: true }),
      activeId: state.activeId === id ? null : state.activeId,
    })),

  maximizeWindow: (id) =>
    setState((state) => ({
      windows: updateWindow(state.windows, id, { maximized: true }),
    })),

  restoreWindow: (id) =>
    setState((state) => ({
      windows: updateWindow(state.windows, id, { maximized: false }),
    })),

  moveWindow: (id, x, y) =>
    setState((state) => ({
      windows: updateWindow(state.windows, id, { x, y }),
    })),

  resizeWindow: (id, width, height) =>
    setState((state) => ({
      windows: updateWindow(state.windows, id, { width, height }),
    })),
})

export const useWindowsStore = create<WindowsState>()(windowsStore)
