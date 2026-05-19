import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { WindowId, WindowRect } from "../types"

interface TaskbarState {
  appRects: Record<WindowId, WindowRect | null>
}

const initialState: TaskbarState = {
  appRects: {},
}

export const taskbarSlice = createSlice({
  name: "taskbar",
  initialState,

  reducers: {
    setAppRect(
      state,
      action: PayloadAction<{ id: WindowId; rect: WindowRect }>,
    ) {
      state.appRects[action.payload.id] = action.payload.rect
    },

    removeAppRect(state, action: PayloadAction<WindowId>) {
      delete state.appRects[action.payload]
    },
  },
})

export const { setAppRect, removeAppRect } = taskbarSlice.actions
export const taskbarReducer = taskbarSlice.reducer
