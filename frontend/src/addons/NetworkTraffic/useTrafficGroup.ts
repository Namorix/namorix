import { useEffect, useRef } from "react"
import { getConnection } from "@namorix/core"

export function useTrafficGroup(active: boolean) {
  const subbed = useRef(false)

  useEffect(() => {
    if (!active) return

    const conn = getConnection()
    if (!conn) return

    const doSub = async () => {
      try {
        await conn.invoke("SubscribeTraffic")
        subbed.current = true
      } catch {
        /* empty */
      }
    }

    doSub().catch(() => {})

    const onReconnected = () => {
      doSub().catch(() => {})
    }
    conn.onreconnected(onReconnected)

    return () => {
      subbed.current = false
      conn.invoke("UnsubscribeTraffic").catch(() => {})
    }
  }, [active])
}
