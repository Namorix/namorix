declare module "http" {
  interface IncomingHttpHeaders {
    "cf-connecting-ip"?: string
    "x-forwarded-for"?: string
    "x-device-fingerprint"?: string
    "x-real-ip"?: string
    "x-client-ip"?: string
    "x-csrf-token"?: string
    "true-client-ip"?: string
  }
}
