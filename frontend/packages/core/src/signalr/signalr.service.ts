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
let hasBeenConnected: boolean = false
let onCloseHandlers: Array<(error?: Error) => void> = []
let statusHandlers: Array<(status: SignalRStatus) => void> = []
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 5000
let intentionalStop = false

export function getConnection(): HubConnection | null {
  return connection
}

export function isHasBeenConnected(): boolean {
  return hasBeenConnected
}

export function setHasBeenConnected(hasBeen: boolean) {
  hasBeenConnected = hasBeen
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
    .configureLogging(LogLevel.Warning)
    .build()

  connection.onreconnecting((error) => {
    console.warn("[signalr] reconnecting...", error?.message)
    emitStatus("reconnecting")
  })

  connection.onreconnected(() => {
    console.info("[signalr] reconnected")
    reconnectDelay = 5000
    emitStatus("connected")
  })

  connection.onclose((error) => {
    console.warn("[signalr] disconnected", error?.message)
    emitStatus("disconnected")
    onCloseHandlers.forEach((handler) => handler(error ?? undefined))

    if (!intentionalStop) {
      scheduleReconnect()
    }
  })

  await connection.start().then(() => {
    if (connection?.state === HubConnectionState.Connected)
      hasBeenConnected = true
  })

  reconnectDelay = 5000
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  emitStatus("connected")
}

export async function stopConnection(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  if (!connection) return
  intentionalStop = true
  hasBeenConnected = false
  await connection.stop()
  connection = null
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null
    reconnectDelay = Math.min(reconnectDelay * 2, 30000)
    try {
      emitStatus("reconnecting")
      await startConnection()
    } catch {
      scheduleReconnect()
    }
  }, reconnectDelay)
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
