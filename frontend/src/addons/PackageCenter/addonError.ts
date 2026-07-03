import { ApiError } from "@namorix/core"
import type { TFunction } from "i18next"
import { AddonErrorCodes } from "../../constants"

const ERROR_CODE_LOCALE_MAP: Record<string, string> = {
  [AddonErrorCodes.NOT_FOUND]: "notFound",
  [AddonErrorCodes.CONTAINER_NOT_FOUND]: "containerNotFound",
  [AddonErrorCodes.IMAGE_NOT_FOUND]: "imageNotFound",
  [AddonErrorCodes.INSTALL_FAILED]: "installFailed",
}

export function formatAddonError(
  t: TFunction,
  err: ApiError,
  addonName?: string,
): string | null {
  switch (err.code) {
    case AddonErrorCodes.NOT_FOUND:
      return t("addon.packageCenter.errors.notFound", {
        name: addonName ?? err.message,
      })
    case AddonErrorCodes.CONTAINER_NOT_FOUND:
      return t("addon.packageCenter.errors.containerNotFound", {
        name: addonName ?? err.message,
      })
    case AddonErrorCodes.IMAGE_NOT_FOUND:
      return t("addon.packageCenter.errors.imageNotFound", {
        name: addonName ?? err.message,
      })
    case AddonErrorCodes.INSTALL_FAILED:
      return t("addon.packageCenter.errors.installFailed", {
        name: addonName ?? err.message,
      })
    default:
      return null
  }
}

export function resolveAddonError(
  t: TFunction,
  err: unknown,
  fallback?: string,
): string {
  if (err instanceof ApiError) {
    return formatAddonError(t, err) ?? err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback ?? String(err)
}

export function formatAddonErrorCode(
  t: TFunction,
  code: string,
  addonName?: string,
): string {
  const key = ERROR_CODE_LOCALE_MAP[code]
  if (key) {
    return t(`addon.packageCenter.errors.${key}`, { name: addonName ?? "" })
  }
  return t("addon.packageCenter.errors.generic", { name: addonName ?? "" })
}
