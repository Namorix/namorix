import type { WindowId } from "../types"
import type { WindowGeometry } from "../types/windowing"
import { create, type StateCreator } from "zustand"

interface WindowGeometryState {
  geometry: WindowGeometry[]

  initGeometry: (geo: WindowGeometry) => void
  removeGeometry: (id: WindowId) => void
  moveWindow: (id: WindowId, x: number, y: number) => void
  resizeWindow: (id: WindowId, width: number, height: number) => void
  savePreMaximize: (id: WindowId, x: number, y: number) => void
  getPreMaximize: (id: WindowId) => { x: number; y: number } | null
}

const windowGeometryStore: StateCreator<WindowGeometryState> = (
  setState,
  getState,
) => ({
  geometry: [],

  initGeometry: (geo) =>
    setState((state) => ({
      geometry: [...state.geometry, geo],
    })),

  removeGeometry: (id) =>
    setState((state) => ({
      geometry: state.geometry.filter((geo) => geo.id !== id),
    })),

  moveWindow: (id, x, y) =>
    setState((state) => ({
      geometry: state.geometry.map((geo) =>
        geo.id === id ? { ...geo, x, y } : geo,
      ),
    })),

  resizeWindow: (id, width, height) =>
    setState((state) => ({
      geometry: state.geometry.map((geo) =>
        geo.id === id ? { ...geo, width, height } : geo,
      ),
    })),

  savePreMaximize: (id, x, y) =>
    setState((state) => ({
      geometry: state.geometry.map((geo) =>
        geo.id === id ? { ...geo, preMaximizeX: x, preMaximizeY: y } : geo,
      ),
    })),

  getPreMaximize(id) {
    const geo = getState().geometry.find((geo) => geo.id === id)
    if (!geo || geo.preMaximizeX == null || geo.preMaximizeY == null) {
      return null
    }
    return { x: geo.preMaximizeX, y: geo.preMaximizeY }
  },
})

export const useWindowGeometryStore =
  create<WindowGeometryState>()(windowGeometryStore)
