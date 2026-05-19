import type { RootState } from "../index"

export const selectorLauncherIsOpen = (state: RootState) =>
  state.launcher.isOpen
