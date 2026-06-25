import type { RootState } from "../index"

export const selectorExternalAddons = (state: RootState) =>
  state.externalAddons.items

export const selectorExternalAddonsOrder = (state: RootState) =>
  state.externalAddons.order

export const selectorExternalAddonsLoading = (state: RootState) =>
  state.externalAddons.loading

export const selectorExternalAddonsInstalling = (state: RootState) =>
  state.externalAddons.installing
