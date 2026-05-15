import type { AddonModule } from "@namorix/core"

const registries = new Map<string, AddonModule>()

export const registerAddon = (addon: AddonModule): void => {
  const { id } = addon.manifest
  if (!registries.has(id)) {
    registries.set(id, addon)
  }
}

export const resolveAddon = (id: string): AddonModule | undefined => {
  return registries.get(id)
}

export const listAddons = (): AddonModule[] => {
  return Array.from(registries.values())
}
