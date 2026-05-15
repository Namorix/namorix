export type WindowId = string

export interface WindowState {
  id: WindowId
  app: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  zIndex: number
}
