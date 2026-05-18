import { create, type StateCreator } from "zustand"

type RectGetter = () => DOMRect | null

interface TaskbarRectState {
  rects: Record<string, RectGetter>
  register: (id: string, getRect: RectGetter) => void
  unregister: (id: string) => void
  getRect: (id: string) => DOMRect | null
}

const taskbarRectStore: StateCreator<TaskbarRectState> = (
  setState,
  getState,
) => ({
  rects: {},
  register: (id, getRect) =>
    setState((state) => ({
      rects: { ...state.rects, [id]: getRect },
    })),

  unregister: (id) => {
    setState((state) => ({
      rects: Object.fromEntries(
        Object.entries(state.rects).filter(([key]) => key !== id),
      ),
    }))
  },

  getRect: (id) => getState().rects[id]?.() ?? null,
})

export const useTaskbarRectStore = create<TaskbarRectState>()(taskbarRectStore)
