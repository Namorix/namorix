import type { SignalrService } from "./signalr.service"
import type { SignalRGroups, SignalREvent } from "./constants"
import { useSignalR as useSignalRCore } from "./useSignalR"
import { useSignalRStatus as useSignalRStatusCore } from "./useSignalRStatus"
import { useSignalRGroup as useSignalRGroupCore } from "./useSignalRGroup"
import { useSignalREvent as useSignalREventCore } from "./useSignalREvent"

export function createSignalRHooks(signalr: SignalrService) {
  return {
    useSignalR: (active: boolean, hubPath?: string) =>
      useSignalRCore(signalr, active, hubPath),

    useSignalRStatus: (hubPath?: string) =>
      useSignalRStatusCore(signalr, hubPath),

    useSignalRGroup: <SG extends SignalRGroups | (string & {}) = SignalRGroups>(
      groupName: SG,
      active: boolean,
      hubPath?: string,
    ) => useSignalRGroupCore<SG>(signalr, groupName, active, hubPath),

    useSignalREvent: <
      T = unknown,
      SE extends SignalREvent | (string & {}) = SignalREvent,
    >(
      eventName: SE,
      handler: (data: T) => void,
      hubPath?: string,
    ) => useSignalREventCore<T, SE>(signalr, eventName, handler, hubPath),
  }
}
