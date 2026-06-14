import { HubConnectionState } from "@microsoft/signalr"
import { useEffect, useRef } from "react"
import { getConnection, type SignalRGroups } from "@namorix/core"
import { groupMethod } from "./utils"

export function useSignalRGroup<
  SG extends SignalRGroups | (string & {}) = SignalRGroups,
>(groupName: SG, active: boolean) {
  const subbed = useRef(false)

  useEffect(() => {
    if (!active) return

    const subMethod = groupMethod<SG>("Subscribe", groupName)
    const unsubMethod = groupMethod<SG>("Unsubscribe", groupName)

    const conn = getConnection()
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
  }, [active, groupName])
}
