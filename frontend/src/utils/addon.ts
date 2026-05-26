import type { AddonItem } from "../types"
import type { TFunction } from "i18next"
import type { LocaleKeys } from "@namorix/core"

export function resolveAddonLocaleTitle(
  t: TFunction,
  addon: AddonItem,
): string | undefined {
  return resolveAddonLocaleTitleByKey(t, addon.localeKey)
}

export function resolveAddonLocaleTitleByKey(
  t: TFunction,
  localeKey?: LocaleKeys,
) {
  return localeKey ? t(`addon.${localeKey}.title`) : undefined
}

export function resolveAddonLocaleDescription(
  t: TFunction,
  addon: AddonItem,
): string | undefined {
  return addon.localeKey ? t(`addon.${addon.localeKey}.description`) : undefined
}
