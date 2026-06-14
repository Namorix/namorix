import type { SignalRGroups } from "./constants"

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const groupMethod = <
  SG extends SignalRGroups | (string & {}) = SignalRGroups,
>(
  prefix: string,
  groupName: SG,
) => prefix + groupName.split("-").map(capitalize).join("")
