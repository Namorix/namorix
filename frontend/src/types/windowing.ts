import type { WindowRect } from "../store"

export const rectToOrigin = (rect: DOMRect): WindowRect => ({
  x: rect.x,
  y: rect.y,
  width: rect.width,
  height: rect.height,
})
