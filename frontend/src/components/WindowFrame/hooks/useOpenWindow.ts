import {
  focusWindow,
  maximizeWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  savePreMaximize,
  store,
  useAppDispatch,
  type WindowRect,
} from "../../../store"
import { getWindowDefaults } from "../../../config"
import { isMobile, NmxAddonInstanceMode } from "@namorix/core"
import type { AddonItem } from "../../../types"

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max))

export const useOpenWindow = () => {
  const dispatch = useAppDispatch()

  return (item: AddonItem, originRect?: WindowRect) => {
    if (item.instanceMode !== NmxAddonInstanceMode.multi) {
      const state = store.getState().windowsState
      const existingWinId = state.order.find(
        (wid) => state.byId[wid]?.item.id === item.id,
      )
      if (existingWinId) {
        dispatch(focusWindow(existingWinId))
        return existingWinId
      }
    }

    const existingCount = store.getState().windowsState.order.length
    const action = dispatch(
      openWindow({
        item,
        originRect: originRect ?? null,
      }),
    )

    const winId = action.payload.id
    const {
      defaultWidth,
      defaultHeight,
      taskbarHeight,
      margin,
      minWidth,
      minHeight,
    } = getWindowDefaults()

    const availableWidth = window.innerWidth
    const availableHeight = window.innerHeight - taskbarHeight

    const maxWidth =
      availableWidth < minWidth ? availableWidth : availableWidth - margin * 2
    const maxHeight =
      availableHeight < minHeight
        ? availableHeight
        : availableHeight - margin * 2

    const desireWidth = item.defaultWidth ?? defaultWidth
    const desireHeight = item.defaultHeight ?? defaultHeight

    const width = clamp(minWidth, desireWidth, maxWidth)
    const height = clamp(minHeight, desireHeight, maxHeight)

    const { cascadeStep, cascadeMaxOffset } = getWindowDefaults()
    const maxOffset = Math.min(
      maxWidth - width,
      maxHeight - height,
      cascadeMaxOffset,
    )

    const offset =
      existingCount === 0
        ? Math.round(Math.random() * maxOffset)
        : ((existingCount - 1) * cascadeStep + cascadeStep) % (maxOffset || 1)

    const x = margin + offset
    const y = margin + offset

    dispatch(moveWindow({ id: winId, x, y }))
    dispatch(resizeWindow({ id: winId, width, height }))

    if (item.preferFullSize || isMobile()) {
      dispatch(savePreMaximize({ id: winId, rect: { x, y, width, height } }))
      dispatch(maximizeWindow(winId))
    }

    return winId
  }
}
