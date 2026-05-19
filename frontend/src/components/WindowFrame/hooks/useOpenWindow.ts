import type { NmxIconSvgSymbol } from "@namorix/ui"
import {
  maximizeWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  savePreMaximize,
  store,
  useAppDispatch,
  type WindowRect,
} from "../../store"
import { getWindowDefaults } from "../../config"

const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max))

export const useOpenWindow = () => {
  const dispatch = useAppDispatch()

  return (
    id: string,
    title: string,
    icon?: NmxIconSvgSymbol,
    originRect?: WindowRect,
    addonWidth?: number,
    addonHeight?: number,
    preferFullSize?: boolean,
  ) => {
    const existingCount = store.getState().windowsState.order.length
    const action = dispatch(
      openWindow({
        app: id,
        title,
        icon,
        defaultWidth: addonWidth,
        defaultHeight: addonHeight,
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

    const desireWidth = addonWidth ?? defaultWidth
    const desireHeight = addonHeight ?? defaultHeight

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

    if (preferFullSize) {
      dispatch(savePreMaximize({ id: winId, rect: { x, y, width, height } }))
      dispatch(maximizeWindow(winId))
    }

    return winId
  }
}
