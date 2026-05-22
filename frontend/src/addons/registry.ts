import { type AddonModule, UserRole } from "@namorix/core"

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

export const listAddons = (userRole?: UserRole): AddonModule[] => {
  return Array.from(registries.values()).filter(
    (addon) =>
      !addon.manifest.role ||
      (userRole !== undefined && userRole === addon.manifest.role),
  )
}
