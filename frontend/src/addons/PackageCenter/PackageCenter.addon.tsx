import { defineAddon, LocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { PackageCenter } from "./PackageCenter"

registerAddon(
  defineAddon(
    {
      id: "package-center",
      displayName: "Package Center",
      description: "Manage external addons and packages",
      localeKey: LocaleKeys.packageCenter,
      icon: NmxIconSvgSymbol.APP_PACKAGE_CENTER,
    },
    PackageCenter,
  ),
)
