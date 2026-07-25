import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { PackageCenter } from "./PackageCenter"
import { AddonEventWatcher } from "./AddonEventWatcher"
import { UserRole } from "@namorix/core"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.packageCenter,
      name: "Package Center",
      description: "Manage external addons and packages",
      localeKey: NmxAddonLocaleKeys.packageCenter,
      icon: NmxIconSvgSymbol.APP_PACKAGE_CENTER,
      role: UserRole.Admin,
    },
    PackageCenter,
    AddonEventWatcher,
  ),
)
