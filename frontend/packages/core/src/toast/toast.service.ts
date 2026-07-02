import type {
  NmxToastDuration,
  NmxToastEvent,
  NmxToastType,
} from "./toast.types"
import { ApiError } from "../http"
import { resolveAuthError } from "../i18n"
import i18n from "i18next"

type ToastListener = (event: NmxToastEvent) => void

class NmxToastBus {
  private listeners = new Set<ToastListener>()

  subscribe(cb: ToastListener): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private emit(
    message: string | unknown,
    type: NmxToastType,
    duration: NmxToastDuration,
  ) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const event: NmxToastEvent = {
      id,
      message,
      type,
      duration,
    }
    this.listeners.forEach((cb) => cb(event))
  }

  short(message: string, type: NmxToastType = "info") {
    this.emit(message, type, "short")
  }

  long(message: string, type: NmxToastType = "info") {
    this.emit(message, type, "long")
  }

  success(message: string) {
    this.emit(message, "success", "short")
  }

  error(message: string | unknown) {
    if (message instanceof Error) {
      const resolved = resolveAuthError(message as ApiError)
      if (resolved) {
        this.emit(i18n.t(resolved.key), "error", "long")
        return
      }
      this.emit(message.message, "error", "long")
      return
    }
    this.emit(String(message), "error", "long")
  }

  warning(message: string) {
    this.emit(message, "warning", "long")
  }
  info(message: string) {
    this.emit(message, "info", "short")
  }
}

export const nmxToast = new NmxToastBus()
