import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { getApiBaseUrl } from "../config"
import { HUB_MAIN } from "../apiRoutes"
import type { SignalRStatus } from "./types"

let connection: HubConnection | null = null
let onCloseHandlers: Array<(error?: Error) => void> = []
let statusHandlers: Array<(status: SignalRStatus) => void> = []

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
    emitStatus("reconnecting")
  })

  connection.onreconnected(() => {
    console.info("[signalr] reconnected")
    emitStatus("connected")
  })

  connection.onclose((error) => {
    console.warn("[signalr] disconnected", error?.message)
    emitStatus("disconnected")
    onCloseHandlers.forEach((handler) => handler(error ?? undefined))
  })

  await connection.start()
  emitStatus("connected")
}

export async function stopConnection(): Promise<void> {
  if (!connection) return
  await connection.stop()
  connection = null
}

export function addOnCloseHandler(handler: (error?: Error) => void) {
  onCloseHandlers.push(handler)
}
export function removeOnCloseHandler(handler: (error?: Error) => void) {
  onCloseHandlers = onCloseHandlers.filter((h) => h !== handler)
}

export function addStatusHandler(handler: (status: SignalRStatus) => void) {
  statusHandlers.push(handler)
}

export function removeStatusHandler(handler: (status: SignalRStatus) => void) {
  statusHandlers = statusHandlers.filter((h) => h !== handler)
}

function emitStatus(status: SignalRStatus) {
  statusHandlers.forEach((h) => h(status))
}
