import { createSlice } from "@reduxjs/toolkit"

interface LauncherState {
  isOpen: boolean
}

const initialState: LauncherState = {
  isOpen: false,
}

export const launcherSlice = createSlice({
  name: "launcher",
  initialState,

  reducers: {
    toggleLauncher(state) {
      state.isOpen = !state.isOpen
    },

    openLauncher(state) {
      state.isOpen = true
    },

    closeLauncher(state) {
      state.isOpen = false
    },
  },
})

export const { toggleLauncher, openLauncher, closeLauncher } =
  launcherSlice.actions
export const launcherReducer = launcherSlice.reducer
