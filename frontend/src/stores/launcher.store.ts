import { create, type StateCreator } from "zustand"

interface LauncherState {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

const LauncherStore: StateCreator<LauncherState> = (setState) => ({
  isOpen: false,
  toggle: () => setState((state) => ({ isOpen: !state.isOpen })),
  open: () => setState({ isOpen: true }),
  close: () => setState({ isOpen: false }),
})

export const useLauncherStore = create<LauncherState>()(LauncherStore)
