import { defineAddon, NmxAddonLocaleKeys } from "@namorix/core"
import { registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { NotificationCenter } from "./NotificationCenter"

registerAddon(
  defineAddon(
    {
      id: "notification-center",
      displayName: "Notification Center",
      description: "View and manage system notifications and alerts",
      localeKey: NmxAddonLocaleKeys.notificationCenter,
      icon: NmxIconSvgSymbol.APP_NOTIFICATION_CENTER,
    },
    NotificationCenter,
  ),
)
