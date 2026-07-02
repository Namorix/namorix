import { getApiBaseUrl } from "../config"
import { getFingerprint } from "../fingerprint"
import { NMX_COOKIE_CSRF_KEY } from "../constants"
import {
  type ApiResponse,
  apiHttpError,
  HttpStatus,
  HttpErrorCodes,
} from "../types"
import { ApiAuthRoutes } from "../apiRoutes"

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | null = null

class RequestBuilder {
  private _url: string
  private _options: RequestInit = { credentials: "include" }
  private _headers: Record<string, string> = {}
  private _retried = false

  constructor(url: string) {
    this._url = url
  }

  private _body(method: string, body?: unknown): this {
    this._options.method = method
    if (body) {
      this._headers["content-type"] = "application/json"
      this._options.body = JSON.stringify(body)
    }

    const csrfToken = this._readCsrfToken()
    if (csrfToken) {
      this._headers["x-csrf-token"] = csrfToken
    }

    return this
  }

  private _readCsrfToken(): string | null {
    const regex = new RegExp(`(?:^|;\\s*)${NMX_COOKIE_CSRF_KEY}=([^;]*)`)
    const match = regex.exec(document.cookie)
    return match?.[1] ?? null
  }

  get() {
    this._options.method = "GET"
    return this
  }

  post(body?: unknown) {
    return this._body("POST", body)
  }

  put(body?: unknown) {
    return this._body("PUT", body)
  }

  patch(body?: unknown) {
    return this._body("PATCH", body)
  }

  delete(body?: unknown) {
    return this._body("DELETE", body)
  }

  header(key: string | (string & {}), value: string) {
    this._headers[key] = value
    return this
  }

  query(params: Record<string, string | number | boolean | undefined | null>) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) {
      this._url += `?${qs}`
    }
    return this
  }

  async json<T>(): Promise<ApiResponse<T>> {
    try {
      const fingerprint = getFingerprint()
      if (fingerprint) {
        this._headers["x-device-fingerprint"] = fingerprint
      }

      const result = await fetch(this._url, {
        ...this._options,
        headers: this._headers,
      })
      if (
        result.status === HttpStatus.UNAUTHORIZED &&
        !this._retried &&
        !this._url.includes(ApiAuthRoutes.refresh) &&
        !this._url.includes(ApiAuthRoutes.session)
      ) {
        const refreshResponse = await nmxHttp
          .url(getApiBaseUrl() + ApiAuthRoutes.refresh)
          .post()
          .json()

        if (!refreshResponse.success) {
          onUnauthorized?.()
          return refreshResponse as unknown as ApiResponse<T>
        }

        if (refreshResponse.success) {
          this._retried = true
          return await this.json<T>()
        }
      }

      return (await result.json()) as Promise<ApiResponse<T>>
    } catch {
      return apiHttpError(
        "Network error",
        HttpErrorCodes.INTERNAL_ERROR,
      ) as ApiResponse<T>
    }
  }
}

export const nmxHttp = {
  url: (url: string) => new RequestBuilder(url),
  getJson: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const result = await fetch(url, { credentials: "include" })
      if (!result.ok) {
        return apiHttpError(
          `HTTP ${result.status}`,
          HttpErrorCodes.INTERNAL_ERROR,
        ) as ApiResponse<T>
      }

      const data = (await result.json()) as T
      return { success: true, data } as ApiResponse<T>
    } catch {
      return apiHttpError(
        "Network error",
        HttpErrorCodes.INTERNAL_ERROR,
      ) as ApiResponse<T>
    }
  },
}

export function setOnUnauthorized(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}
