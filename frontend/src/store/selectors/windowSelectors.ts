import { createSelector } from "@reduxjs/toolkit"
import type { WindowData, WindowId } from "../types"
import type { RootState } from "../index"

export const selectorWindowsState = (state: RootState) => state.windowsState

export const selectorWindowOrder = (state: RootState) =>
  state.windowsState.order

export const selectorZOrder = (state: RootState) => state.windowsState.zOrder

export const selectorActiveId = (state: RootState) =>
  state.windowsState.activeId

export const selectorWindowList = createSelector(
  [selectorWindowsState],
  (windows) =>
    windows.order.map((id) => windows.byId[id]).filter(Boolean) as WindowData[],
)

export const selectorById = (id: WindowId) => (state: RootState) =>
  state.windowsState.byId[id]

export const selectorWindowCount = (state: RootState) =>
  state.windowsState.order.length

export const selectorMaximized = (id: WindowId) => (state: RootState) =>
  state.windowsState.byId[id]?.maximized ?? false

export const selectorAnimState = (id: WindowId) => (state: RootState) =>
  state.windowsState.byId[id]?.animState ?? "opening"

export const selectorPreMaximize = (id: WindowId) => (state: RootState) =>
  state.windowsState.byId[id]?.preMaximize ?? null

export const selectorZIndex = (id: WindowId) => (state: RootState) =>
  state.windowsState.zOrder.indexOf(id)
