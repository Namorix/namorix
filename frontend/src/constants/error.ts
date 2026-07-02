export const AddonErrorCodes = {
  NOT_FOUND: "ADDON_NOT_FOUND",
  CONTAINER_NOT_FOUND: "CONTAINER_NOT_FOUND",
  INSTALL_FAILED: "INSTALL_FAILED",
} as const

export type AddonErrorCodes =
  (typeof AddonErrorCodes)[keyof typeof AddonErrorCodes]
