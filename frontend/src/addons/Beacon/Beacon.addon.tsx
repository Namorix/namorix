import { defineAddon, NmxAddonId, NmxAddonLocaleKeys, registerAddon } from "../"
import { NmxIconSvgSymbol } from "@namorix/ui"
import { Beacon } from "./Beacon"
import { registerNotificationDescriptionRenderer } from "../../utils/notification"
import { BeaconErrorCodes } from "./Beacon.types"

registerAddon(
  defineAddon(
    {
      id: NmxAddonId.beacon,
      name: "Beacon",
      description: "Updates your DNS when your IP changes",
      localeKey: NmxAddonLocaleKeys.beacon,
      icon: NmxIconSvgSymbol.APP_BEACON,
    },
    Beacon,
  ),
)

registerNotificationDescriptionRenderer("beacon", (t, notif, params) => {
  if (notif.key !== "beacon:hostnameError" || !params?.error) {
    return undefined
  }
  const errorKey = BeaconErrorCodes[params.error]
  if (errorKey) {
    params.error = t(errorKey, {
      hostname: params.hostname,
      provider: params.provider
        ? t(`addon.beacon.providers.${params.provider}`, {
            defaultValue: params.provider,
          })
        : undefined,
      detail: params.detail ?? "",
    })
  }
  return t(`notification:${notif.key}`, params)
})
