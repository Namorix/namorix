export interface FingerprintComponents {
  userAgent: string
  language: string
  screenWidth: number
  screenHeight: number
  timezoneOffset: number
  hardwareConcurrency: number
}

export type Fingerprint = string
