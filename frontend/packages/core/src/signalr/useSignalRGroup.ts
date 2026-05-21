import { useEffect, useRef } from "react"
import { getConnection, type SignalRGroups } from "@namorix/core"
import { groupMethod } from "./utils"

export function useSignalRGroup(groupName: SignalRGroups, active: boolean) {
  const subbed = useRef(false)

  useEffect(() => {
    if (!active) return

    const subMethod = groupMethod("Subscribe", groupName)
    const unsubMethod = groupMethod("Unsubscribe", groupName)

    const conn = getConnection()
    if (!conn) return

    const doSub = async () => {
      try {
        await conn.invoke(subMethod)
        subbed.current = true
      } catch {
        /* empty */
      }
    }

    doSub().catch((err) => console.warn("SubscribeTraffic failed:", err))

    const onReconnected = () => {
      if (!subbed.current)
        doSub().catch((err) => console.warn("SubscribeTraffic failed:", err))
    }
    conn.onreconnected(onReconnected)

    return () => {
      subbed.current = false
      conn
        .invoke(unsubMethod)
        .catch((err) => console.warn("UnsubscribeTraffic failed:", err))
    }
  }, [active, groupName])
}
