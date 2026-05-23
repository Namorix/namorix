import type { AnimState, WindowData, WindowId, WindowRect } from "../types"
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface WindowsState {
  byId: Record<WindowId, WindowData>
  order: WindowId[]
  zOrder: WindowId[]
  activeId: WindowId | null
}

const initialState: WindowsState = {
  byId: {},
  order: [],
  zOrder: [],
  activeId: null,
}

function generateId(): WindowId {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `win-${Date.now()}-${rand}` as WindowId
}

function defocusAllWindows(state: WindowsState) {
  for (const wid of state.order) {
    const win = state.byId[wid]
    if (win) win.focused = false
  }
  state.activeId = null
}

export const windowsSlice = createSlice({
  name: "windows",
  initialState,

  reducers: {
    openWindow: {
      reducer(
        state,
        action: PayloadAction<{ id: WindowId; window: WindowData }>,
      ) {
        const { id, window } = action.payload
        state.byId[id] = window

        defocusAllWindows(state)

        state.order.push(id)
        state.zOrder.push(id)
        state.activeId = id
      },

      prepare(payload: {
        app: string
        title: string
        icon?: WindowData["icon"]
        defaultWidth?: number
        defaultHeight?: number
        originRect?: WindowRect | null
      }) {
        const id = generateId()
        const window: WindowData = {
          id,
          app: payload.app,
          title: payload.title,
          icon: payload.icon,
          minimized: false,
          maximized: false,
          focused: true,
          animState: "opening",
          x: 0,
          y: 0,
          width: payload.defaultWidth ?? 640,
          height: payload.defaultHeight ?? 480,
          preMaximize: null,
          originRect: payload.originRect ?? null,
        }

        return { payload: { id, window } }
      },
    },

    closeWindow(state, action: PayloadAction<WindowId>) {
      const id = action.payload
      delete state.byId[id]
      state.order = state.order.filter((wid) => wid !== id)
      state.zOrder = state.zOrder.filter((wid) => wid !== id)
      if (state.activeId === id) {
        state.activeId = state.order.at(-1) ?? null
      }
    },

    focusWindow(state, action: PayloadAction<WindowId>) {
      const id = action.payload
      const win = state.byId[id]

      if (!win || state.activeId === id) {
        return
      }

      const wasMinimized = win.minimized
      win.focused = true
      win.minimized = false
      state.zOrder = state.zOrder.filter((wid) => wid !== id)
      state.zOrder.push(id)
      state.activeId = id

      if (wasMinimized) {
        win.animState = "restoring"
      }
    },

    minimizeWindow(state, action: PayloadAction<WindowId>) {
      const id = action.payload
      const win = state.byId[id]

      if (!win) {
        return
      }

      win.minimized = true
      win.focused = false
      win.animState = "minimizing"

      if (state.activeId === id) {
        state.activeId =
          state.order
            .filter((wid) => !state.byId[wid]?.minimized && wid !== id)
            .at(-1) ?? null
      }
    },

    maximizeWindow(state, action: PayloadAction<WindowId>) {
      const win = state.byId[action.payload]
      if (win) win.maximized = true
    },

    restoreWindow(state, action: PayloadAction<WindowId>) {
      const win = state.byId[action.payload]
      if (win) win.maximized = false
    },

    defocusAll(state) {
      defocusAllWindows(state)
    },

    setAnimState(
      state,
      action: PayloadAction<{ id: WindowId; anim: AnimState }>,
    ) {
      const { id, anim } = action.payload
      const win = state.byId[id]
      if (win) win.animState = anim
    },

    moveWindow(
      state,
      action: PayloadAction<{ id: WindowId; x: number; y: number }>,
    ) {
      const { id, x, y } = action.payload
      const win = state.byId[id]
      if (win) {
        win.x = x
        win.y = y
      }
    },

    resizeWindow(
      state,
      action: PayloadAction<{ id: WindowId; width: number; height: number }>,
    ) {
      const { id, width, height } = action.payload
      const win = state.byId[id]
      if (win) {
        win.width = width
        win.height = height
      }
    },

    savePreMaximize(
      state,
      action: PayloadAction<{ id: WindowId; rect: WindowRect }>,
    ) {
      const win = state.byId[action.payload.id]
      if (win) win.preMaximize = action.payload.rect
    },

    clearPreMaximize(state, action: PayloadAction<WindowId>) {
      const win = state.byId[action.payload]
      if (win) win.preMaximize = null
    },

    setOriginRect(
      state,
      action: PayloadAction<{ id: WindowId; rect: WindowRect | null }>,
    ) {
      const win = state.byId[action.payload.id]
      if (win) win.originRect = action.payload.rect
    },

    closeAllWindows(state) {
      state.byId = {}
      state.order = []
      state.zOrder = []
    },
  },
})

export const {
  openWindow,
  closeWindow,
  focusWindow,
  minimizeWindow,
  maximizeWindow,
  restoreWindow,
  defocusAll,
  setAnimState,
  moveWindow,
  resizeWindow,
  savePreMaximize,
  clearPreMaximize,
  setOriginRect,
  closeAllWindows,
} = windowsSlice.actions

export const windowsReducer = windowsSlice.reducer
