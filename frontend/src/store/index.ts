import { configureStore } from "@reduxjs/toolkit"
import { launcherReducer, taskbarReducer, windowsReducer } from "./slices"

export const store = configureStore({
  reducer: {
    windowsState: windowsReducer,
    launcher: launcherReducer,
    taskbar: taskbarReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export * from "./selectors"
export * from "./slices"
export * from "./hooks"
export * from "./types"
