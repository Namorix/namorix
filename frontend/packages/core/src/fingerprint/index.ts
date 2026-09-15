import type { Fingerprint } from "./types"

let cachedFingerprint: Fingerprint | null = null
let isResolved = false

const DEVICE_ID_KEY = "nmx_device_id"

// crypto.randomUUID() and crypto.subtle are secure-context only, so both are missing when
// the desktop is reached over plain HTTP on a LAN address. getRandomValues carries no such
// restriction, hence the id is assembled from it by hand.
const newDeviceId = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

// The fingerprint names the browser profile, not the machine: a random id minted once and
// kept in localStorage. Screen size, locale and timezone were the previous inputs, and all
// of them change while the refresh token is still alive (7-90 days) — dragging the window
// to a second monitor read as token theft, and the reaction revoked every session the user
// had. An id only this profile can present is both steadier and harder to forge.
//
// localStorage can be refused outright (private mode, enterprise policy). There is no id
// to fall back on then, so no fingerprint is sent and the server skips the comparison
// rather than being handed a value that could never match.
const readDeviceId = (): string | null => {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) {
      return existing
    }

    const id = newDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return null
  }
}

const sha256 = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const cryptoSubtle = crypto.subtle as SubtleCrypto | undefined
  if (!cryptoSubtle) {
    return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  }

  const hashBuffer = await cryptoSubtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Callers read the value through getFingerprint(), which is sync and returns null until
// this resolves — awaiting it before the first request keeps that from silently dropping
// the header, which used to erase the stored fingerprint and disable the check.
export const generateFingerprint = async (): Promise<Fingerprint> => {
  if (isResolved) {
    return cachedFingerprint ?? ""
  }

  const deviceId = readDeviceId()
  // Temporary diagnostic: the id is what the fingerprint is derived from, so the same
  // browser can be compared across states — it has to survive a reload and a monitor
  // switch, and has to differ in another browser. Drop once the new scheme is confirmed.
  cachedFingerprint = deviceId ? await sha256(deviceId) : null
  isResolved = true
  return cachedFingerprint ?? ""
}

export const getFingerprint = (): Fingerprint | null => cachedFingerprint
