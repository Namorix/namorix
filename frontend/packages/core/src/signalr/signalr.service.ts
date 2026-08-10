import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr"
import type { NmxCoreClient } from "../config"
import { HUB_MAIN } from "../apiRoutes"
import type { AuthRefreshService } from "../http"
import type { SignalRStatus } from "./types"

export interface SignalrServiceDeps {
  core: NmxCoreClient
  authRefresh: AuthRefreshService
}

export class SignalrClient {
  readonly hubPath: string
  private readonly core: NmxCoreClient
  private readonly authRefresh: AuthRefreshService

  private connection: HubConnection | null = null
  private hasBeenConnected = false
  private onCloseHandlers: Array<(error?: Error) => void> = []
  private statusHandlers: Array<(status: SignalRStatus) => void> = []
  private pendingHandlers = new Map<string, Array<(...args: any[]) => void>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 5000
  private intentionalStop = false

  constructor(deps: { hubPath: string } & SignalrServiceDeps) {
    this.hubPath = deps.hubPath
    this.core = deps.core
    this.authRefresh = deps.authRefresh
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

    this.intentionalStop = false

    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(this.core.getApiBaseUrl() + this.hubPath)
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
        if (!this.intentionalStop) this.scheduleReconnect()
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

      const refreshResult = await this.authRefresh.refreshAccessToken()
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

export interface SignalrService {
  resolveHubPath(hubPath?: string): string
  getSignalrClient(hubPath?: string): SignalrClient
  getConnection(hubPath?: string): HubConnection | null
  isHasBeenConnected(hubPath?: string): boolean
  setHasBeenConnected(hasBeen: boolean, hubPath?: string): void
  getConnectionState(hubPath?: string): HubConnectionState
  startConnection(hubPath?: string): Promise<void>
  stopConnection(hubPath?: string): Promise<void>
  addOnCloseHandler(handler: (error?: Error) => void, hubPath?: string): void
  removeOnCloseHandler(handler: (error?: Error) => void, hubPath?: string): void
  addStatusHandler(
    handler: (status: SignalRStatus) => void,
    hubPath?: string,
  ): void
  removeStatusHandler(
    handler: (status: SignalRStatus) => void,
    hubPath?: string,
  ): void
}

export function createSignalrService(deps: SignalrServiceDeps): SignalrService {
  const { core, authRefresh } = deps
  const clients = new Map<string, SignalrClient>()

  const resolveHubPath = (hubPath?: string): string =>
    hubPath ?? core.getHubsPath() ?? HUB_MAIN

  const getSignalrClient = (
    hubPath: string = resolveHubPath(),
  ): SignalrClient => {
    let client = clients.get(hubPath)
    if (!client) {
      client = new SignalrClient({ hubPath, core, authRefresh })
      clients.set(hubPath, client)
    }
    return client
  }

  return {
    resolveHubPath,
    getSignalrClient,
    getConnection: (hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).getConnection(),
    isHasBeenConnected: (hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).isHasBeenConnected(),
    setHasBeenConnected: (hasBeen, hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).setHasBeenConnected(hasBeen),
    getConnectionState: (hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).getConnectionState(),
    startConnection: (hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).start(),
    stopConnection: (hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).stop(),
    addOnCloseHandler: (handler, hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).addOnCloseHandler(handler),
    removeOnCloseHandler: (handler, hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).removeOnCloseHandler(handler),
    addStatusHandler: (handler, hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).addStatusHandler(handler),
    removeStatusHandler: (handler, hubPath = resolveHubPath()) =>
      getSignalrClient(hubPath).removeStatusHandler(handler),
  }
}
