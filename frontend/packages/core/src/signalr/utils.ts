import type { SignalRGroups } from "./constants"

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export const groupMethod = (prefix: string, groupName: SignalRGroups) =>
  prefix + capitalize(groupName)
