import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type {
  AddonCatalogEntry,
  AddonStatusPayload,
  ExternalAddonManifest,
} from "@namorix/core"

export interface ExternalAddonsState {
  items: Record<string, ExternalAddonManifest>
  order: string[]
  loading: boolean
  installing: boolean
  catalog: Record<string, AddonCatalogEntry>
}

const initialState: ExternalAddonsState = {
  items: {},
  order: [],
  loading: false,
  installing: false,
  catalog: {},
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

    updateAddonStatus(state, action: PayloadAction<AddonStatusPayload>) {
      const existing = state.items[action.payload.addonId]
      if (existing) {
        existing.status = action.payload.status
        if (action.payload.lastErrorCode !== undefined) {
          existing.lastErrorCode = action.payload.lastErrorCode
        }

        if (
          action.payload.status === "running" ||
          action.payload.status === "stopped" ||
          action.payload.status === "installed" ||
          action.payload.status === "error"
        ) {
          existing.pendingTaskId = undefined
          existing.pendingTaskPhase = undefined
        }
      } else {
        const catalogEntry = state.catalog[action.payload.addonId]
        state.items[action.payload.addonId] = {
          id: action.payload.addonId,
          name: catalogEntry?.name ?? action.payload.addonId,
          status: action.payload.status,
        } as ExternalAddonManifest
        if (!state.order.includes(action.payload.addonId)) {
          state.order.push(action.payload.addonId)
        }
      }
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

    setCatalog(state, action: PayloadAction<AddonCatalogEntry[]>) {
      const catalog: Record<string, AddonCatalogEntry> = {}
      for (const entry of action.payload) {
        catalog[entry.id] = entry
      }
      state.catalog = catalog
    },
  },
})

export const {
  setAddons,
  updateAddonStatus,
  removeAddon,
  setAddonLoading,
  setAddonInstalling,
  setCatalog,
} = externalAddonsSlice.actions

export const externalAddonsSliceReducer = externalAddonsSlice.reducer
