import type {
  ServerSignalRGroupsType,
  ServerSignalREventType,
} from "./constants"
import { coreConfig } from "../config/coreConfig"

export const {
  useSignalR,
  useSignalRStatus,
  useSignalRGroup,
  useSignalREvent,
} = coreConfig.signalRHooks

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
