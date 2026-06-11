export interface NmxNotificationDto {
  id: number
  type: "info" | "success" | "warning" | "error" | "security"
  key: string
  params?: string
  source?: string
  isRead: boolean
  createdAt: string
  occurrences: number
  lastOccurredAt: string
}
