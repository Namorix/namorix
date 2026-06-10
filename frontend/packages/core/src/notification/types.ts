export interface NmxNotificationDto {
  id: number
  type: "info" | "success" | "warning" | "error"
  titleKey: string
  descriptionKey?: string
  params?: string
  source?: string
  isRead: boolean
  createdAt: string
}
