import type { Fingerprint, FingerprintComponents } from "./types"

let cachedFingerprint: Fingerprint | null = null

const collectComponents = (): FingerprintComponents => ({
  userAgent: navigator.userAgent,
  language: navigator.language,
  screenWidth: screen.width,
  screenHeight: screen.height,
  timezoneOffset: new Date().getTimezoneOffset(),
  hardwareConcurrency: navigator.hardwareConcurrency,
})

const sha256 = async (data: string): Promise<string> => {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const cryptoSubtle = crypto.subtle as SubtleCrypto | undefined
  if (!cryptoSubtle) {
    return btoa(data).replace(/[+=]/g, "")
  }

  const hashBuffer = await cryptoSubtle.digest("SHA-256", dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export const generateFingerprint = async (): Promise<Fingerprint> => {
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  const components = collectComponents()
  cachedFingerprint = await sha256(Object.values(components).join("|"))
  return cachedFingerprint
}

export const getFingerprint = (): Fingerprint | null => cachedFingerprint
