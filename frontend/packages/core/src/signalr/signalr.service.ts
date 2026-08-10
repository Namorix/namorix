import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import { getApiBaseUrl, getHubsPath } from "../config"
import { HUB_MAIN } from "../apiRoutes"
import { refreshAccessToken } from "../http"
import type { SignalRStatus } from "./types"

class SignalrClient {
  readonly hubPath: string

  private connection: HubConnection | null = null
  private hasBeenConnected: boolean = false
  private onCloseHandlers: Array<(error?: Error) => void> = []
  private statusHandlers: Array<(status: SignalRStatus) => void> = []
  private pendingHandlers = new Map<string, Array<(...args: any[]) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 5000
  private intentionalStop = false

  constructor(hubPath: string) {
    this.hubPath = hubPath
  }

  getConnection(): HubConnection | null {
    return this.connection
  }

  isHasBeenConnected(): boolean {
    return this.hasBeenConnected
  }

  setHasBeenConnected(hasBeen: boolean) {
    this.hasBeenConnected = hasBeen
  }

  getConnectionState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected
  }

  // Register a handler before the connection exists; it is flushed to the
  // hub once the connection is built and survives reconnects (same object).
  on(eventName: string, handler: (...args: any[]) => void) {
    const conn = this.connection
    if (conn) {
      conn.on(eventName, handler)
      return
    }
    const handlers = this.pendingHandlers.get(eventName) ?? []
    handlers.push(handler)
    this.pendingHandlers.set(eventName, handlers)
  }

  off(eventName: string, handler: (...args: any[]) => void) {
    const conn = this.connection
    if (conn) conn.off(eventName, handler)
    const pending = this.pendingHandlers
      .get(eventName)
      ?.filter((h) => h !== handler)
    if (!pending) return
    if (pending.length) this.pendingHandlers.set(eventName, pending)
    else this.pendingHandlers.delete(eventName)
  }

  async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) return
    if (this.connection?.state === HubConnectionState.Connecting) return

    // A fresh start begins a new lifecycle: a previous stop() set this flag
    // to suppress reconnect during teardown; clear it so later drops reconnect.
    this.intentionalStop = false

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(getApiBaseUrl() + this.hubPath)
        .configureLogging(LogLevel.Warning)
        .build()

      for (const [eventName, handlers] of this.pendingHandlers) {
        for (const handler of handlers) this.connection.on(eventName, handler)
      }

      this.connection.onreconnecting((error) => {
        console.warn(`[signalr]${this.hubPath} reconnecting...`, error?.message)
        this.emitStatus("reconnecting")
      })

      this.connection.onreconnected(() => {
        console.info(`[signalr]${this.hubPath} reconnected`)
        this.reconnectDelay = 5000
        this.emitStatus("connected")
      })

      this.connection.onclose((error) => {
        console.warn(`[signalr]${this.hubPath} disconnected`, error?.message)
        this.emitStatus("disconnected")
        this.onCloseHandlers.forEach((handler) => handler(error ?? undefined))
        if (!this.intentionalStop) {
          this.scheduleReconnect()
        }
      })
    }

    await this.connection.start().then(() => {
      if (this.connection?.state === HubConnectionState.Connected)
        this.hasBeenConnected = true
    })

    this.reconnectDelay = 5000
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.emitStatus("connected")
  }

  async stop(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (!this.connection) return
    this.intentionalStop = true
    this.hasBeenConnected = false
    await this.connection.stop()
    this.connection = null
  }

  addOnCloseHandler(handler: (error?: Error) => void) {
    this.onCloseHandlers.push(handler)
  }

  removeOnCloseHandler(handler: (error?: Error) => void) {
    this.onCloseHandlers = this.onCloseHandlers.filter((h) => h !== handler)
  }

  addStatusHandler(handler: (status: SignalRStatus) => void) {
    this.statusHandlers.push(handler)
  }

  removeStatusHandler(handler: (status: SignalRStatus) => void) {
    this.statusHandlers = this.statusHandlers.filter((h) => h !== handler)
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
      this.emitStatus("reconnecting")

      const refreshResult = await refreshAccessToken()
      if (refreshResult === "expired") return

      if (refreshResult === "success") {
        try {
          await this.start()
          return
        } catch {
          // fall through to retry with backoff
        }
      }

      this.scheduleReconnect()
    }, this.reconnectDelay)
  }

  private emitStatus(status: SignalRStatus) {
    this.statusHandlers.forEach((h) => h(status))
  }
}

export function resolveHubPath(hubPath?: string): string {
  return hubPath ?? getHubsPath() ?? HUB_MAIN
}

const clients = new Map<string, SignalrClient>()

export function getSignalrClient(hubPath: string = resolveHubPath()): SignalrClient {
  let client = clients.get(hubPath)
  if (!client) {
    client = new SignalrClient(hubPath)
    clients.set(hubPath, client)
  }
  return client
}

export function getConnection(
  hubPath: string = resolveHubPath(),
): HubConnection | null {
  return getSignalrClient(hubPath).getConnection()
}

export function isHasBeenConnected(hubPath: string = resolveHubPath()): boolean {
  return getSignalrClient(hubPath).isHasBeenConnected()
}

export function setHasBeenConnected(
  hasBeen: boolean,
  hubPath: string = resolveHubPath(),
) {
  getSignalrClient(hubPath).setHasBeenConnected(hasBeen)
}

export function getConnectionState(
  hubPath: string = resolveHubPath(),
): HubConnectionState {
  return getSignalrClient(hubPath).getConnectionState()
}

export async function startConnection(
  hubPath: string = resolveHubPath(),
): Promise<void> {
  await getSignalrClient(hubPath).start()
}

export async function stopConnection(
  hubPath: string = resolveHubPath(),
): Promise<void> {
  await getSignalrClient(hubPath).stop()
}

export function addOnCloseHandler(
  handler: (error?: Error) => void,
  hubPath: string = resolveHubPath(),
) {
  getSignalrClient(hubPath).addOnCloseHandler(handler)
}

export function removeOnCloseHandler(
  handler: (error?: Error) => void,
  hubPath: string = resolveHubPath(),
) {
  getSignalrClient(hubPath).removeOnCloseHandler(handler)
}

export function addStatusHandler(
  handler: (status: SignalRStatus) => void,
  hubPath: string = resolveHubPath(),
) {
  getSignalrClient(hubPath).addStatusHandler(handler)
}

export function removeStatusHandler(
  handler: (status: SignalRStatus) => void,
  hubPath: string = resolveHubPath(),
) {
  getSignalrClient(hubPath).removeStatusHandler(handler)
}
