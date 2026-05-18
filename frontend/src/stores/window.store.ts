import { create, type StateCreator } from "zustand"
import type { WindowId, WindowState } from "../types"
import type { NmxAddonIconType } from "@namorix/core"

interface WindowsState {
  windows: WindowState[]
  activeId: WindowId | null
  nextZIndex: number

  openWindow: (app: string, title: string, icon?: NmxAddonIconType) => WindowId
  closeWindow: (id: WindowId) => void
  focusWindow: (id: WindowId) => void
  minimizeWindow: (id: WindowId) => void
  maximizeWindow: (id: WindowId) => void
  restoreWindow: (id: WindowId) => void
}

let _idCounter = 0

const windowsStore: StateCreator<WindowsState> = (setState, getState) => ({
  windows: [],
  activeId: null,
  nextZIndex: 1,

  openWindow(app: string, title: string, icon?: NmxAddonIconType): WindowId {
    const id = `win-${Date.now()}-${++_idCounter}`
    const { nextZIndex } = getState()

    const win: WindowState = {
      id,
      app,
      icon,
      title,
      minimized: false,
      maximized: false,
      focused: false,
      zIndex: nextZIndex,
    }

    setState((state) => ({
      windows: [
        ...state.windows.map((win) => ({ ...win, focused: false })),
        win,
      ],
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
          ? remaining.toSorted((a, b) => b.zIndex - a.zIndex)[0]
          : null

      return {
        windows: remaining.map((win) => ({
          ...win,
          focused: win.id === topWindow?.id,
        })),
        activeId:
          state.activeId === id ? (topWindow?.id ?? null) : state.activeId,
      }
    })
  },

  focusWindow(id) {
    setState((state) => {
      if (state.activeId === id) {
        return state
      }

      const exists = state.windows.some((window) => window.id === id)
      if (!exists) {
        return state
      }

      return {
        windows: state.windows.map((win) => ({
          ...win,
          focused: win.id === id,
          minimized: win.id === id ? false : win.minimized,
          zIndex: win.id === id ? state.nextZIndex : win.zIndex,
        })),
        activeId: id,
        nextZIndex: state.nextZIndex + 1,
      }
    })
  },

  minimizeWindow: (id) =>
    setState((state) => {
      const remaining = state.windows.filter(
        (win) => !win.minimized && win.id !== id,
      )

      const topWindow =
        remaining.length > 0
          ? remaining.toSorted((a, b) => b.zIndex - a.zIndex)[0]
          : null

      return {
        windows: state.windows.map((win) => ({
          ...win,
          minimized: win.id === id ? true : win.minimized,
          focused: win.id === topWindow?.id,
        })),
        activeId:
          state.activeId === id ? (topWindow?.id ?? null) : state.activeId,
      }
    }),

  maximizeWindow: (id) =>
    setState((state) => ({
      windows: state.windows.map((win) =>
        win.id === id
          ? {
              ...win,
              maximized: true,
            }
          : win,
      ),
    })),

  restoreWindow: (id) =>
    setState((state) => ({
      windows: state.windows.map((win) =>
        win.id === id
          ? {
              ...win,
              maximized: false,
            }
          : win,
      ),
    })),
})

export const useWindowsStore = create<WindowsState>()(windowsStore)
