import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AddonContainerStatus, ExternalAddonManifest } from "@namorix/core"

export interface ExternalAddonsState {
  items: Record<string, ExternalAddonManifest>
  order: string[]
  loading: boolean
  installing: boolean
}

const initialState: ExternalAddonsState = {
  items: {},
  order: [],
  loading: false,
  installing: false,
}

export const externalAddonsSlice = createSlice({
  name: "externalAddons",
  initialState,

  reducers: {
    setAddons(state, action: PayloadAction<ExternalAddonManifest[]>) {
      const items: Record<string, ExternalAddonManifest> = {}
      const order: string[] = []
      for (const addon of action.payload) {
        items[addon.id] = addon
        order.push(addon.id)
      }
      state.items = items
      state.order = order
    },

    updateAddonStatus(
      state,
      action: PayloadAction<{ addonId: string; status: AddonContainerStatus }>,
    ) {
      const addon = state.items[action.payload.addonId]
      if (addon) addon.status = action.payload.status
    },

    removeAddon(state, action: PayloadAction<string>) {
      delete state.items[action.payload]
      state.order = state.order.filter((id) => id !== action.payload)
    },

    setAddonLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload
    },

    setAddonInstalling(state, action: PayloadAction<boolean>) {
      state.installing = action.payload
    },
  },
})

export const {
  setAddons,
  updateAddonStatus,
  removeAddon,
  setAddonLoading,
  setAddonInstalling,
} = externalAddonsSlice.actions

export const externalAddonsSliceReducer = externalAddonsSlice.reducer
