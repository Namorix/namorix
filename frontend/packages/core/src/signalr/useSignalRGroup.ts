import { HubConnectionState } from "@microsoft/signalr"
import { useEffect, useRef } from "react"
import type { SignalrService } from "./signalr.service"
import type { SignalRGroups } from "./constants"
import { groupMethod } from "./utils"

export function useSignalRGroup<
  SG extends SignalRGroups | (string & {}) = SignalRGroups,
>(signalr: SignalrService, groupName: SG, active: boolean, hubPath?: string) {
  const subbed = useRef(false)
  const client = signalr.getSignalrClient(hubPath)

  useEffect(() => {
    if (!active) return

    const subMethod = groupMethod<SG>("Subscribe", groupName)
    const unsubMethod = groupMethod<SG>("Unsubscribe", groupName)

    const conn = client.getConnection()
    if (!conn) return

    const doSub = async () => {
      await conn.invoke(subMethod)
      subbed.current = true
    }

    doSub().catch((err) => console.warn(`${subMethod} failed:`, err))

    const onReconnected = () => {
      if (!subbed.current)
        doSub().catch((err) => console.warn(`${subMethod} failed:`, err))
    }
    conn.onreconnected(onReconnected)

    return () => {
      subbed.current = false
      if (conn.state !== HubConnectionState.Connected) return
      conn
        .invoke(unsubMethod)
        .catch((err) => console.warn(`${unsubMethod} failed:`, err))
    }
  }, [active, groupName, hubPath, client])
}
