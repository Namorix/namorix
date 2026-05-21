import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { getApiBaseUrl } from "../config"
import { HUB_MAIN } from "../apiRoutes"

let connection: HubConnection | null = null

export function getConnection(): HubConnection | null {
  return connection
}

export function getConnectionState(): HubConnectionState {
  return connection?.state ?? HubConnectionState.Disconnected
}

export async function startConnection(): Promise<void> {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    return
  }

  connection = new HubConnectionBuilder()
    .withUrl(getApiBaseUrl() + HUB_MAIN)
    .withAutomaticReconnect([0, 2000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build()

  connection.onreconnecting((error) => {
    console.warn("[signalr] reconnecting...", error?.message)
  })

  connection.onreconnected(() => {
    console.info("[signalr] reconnected")
  })

  connection.onclose((error) => {
    console.warn("[signalr] disconnected", error?.message)
  })

  await connection.start()
}

export async function stopConnection(): Promise<void> {
  if (!connection) return
  await connection.stop()
  connection = null
}
