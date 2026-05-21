export interface EndpointStats {
  endpointId: number
  path: string
  method: string
  count: number
  avgDurationMs: number
  errorRate: number
}

export interface TrafficEndpoint {
  id: number
  method: string
  path: string
  label?: string
  addonId?: string
  isEnabled: boolean
  createdAt: string
}

export interface TrafficLog {
  id: number
  endpointId: number
  statusCode: number
  durationMs: number
  responseSizeBytes: number
  trafficAddressId?: number
  userId?: number
  timestamp: string
}
