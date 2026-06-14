import { useSignalRGroup, useSignalREvent } from "@namorix/core"
import type {
  ServerSignalRGroupsType,
  ServerSignalREventType,
} from "./constants"

export function useServerSignalRGroup(
  groupName: ServerSignalRGroupsType,
  active: boolean,
) {
  return useSignalRGroup<ServerSignalRGroupsType>(groupName, active)
}

export function useServerSignalREvent<T = unknown>(
  eventName: ServerSignalREventType,
  handler: (data: T) => void,
) {
  return useSignalREvent<T, ServerSignalREventType>(eventName, handler)
}
