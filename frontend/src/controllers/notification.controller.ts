import {
  nmxHttp,
  getApiBaseUrl,
  ApiNotificationRoutes,
  ApiError,
} from "@namorix/core"
import type { NmxNotificationDto } from "@namorix/core"

interface PaginatedResult {
  items: NmxNotificationDto[]
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function fetchNotifications(
  page: number,
  pageSize: number = 20,
): Promise<PaginatedResult> {
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiNotificationRoutes.base)
    .query({ page, pageSize })
    .get()
    .json<PaginatedResult>()
  if (!res.success) throw ApiError.fromResponse(res)
  return res.data
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiNotificationRoutes.unreadCount)
    .get()
    .json<number>()

  if (!res.success) throw ApiError.fromResponse(res)
  return res.data
}

export async function markAsRead(id: number): Promise<void> {
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiNotificationRoutes.base + `/${id}/read`)
    .post()
    .json()

  if (!res.success) throw ApiError.fromResponse(res)
}

export async function markAllAsRead(): Promise<number> {
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiNotificationRoutes.readAll)
    .post()
    .json<number>()

  if (!res.success) throw ApiError.fromResponse(res)
  return res.data
}

export async function deleteRead(): Promise<void> {
  const res = await nmxHttp
    .url(getApiBaseUrl() + ApiNotificationRoutes.deleteRead)
    .delete()
    .json()
  if (!res.success) throw ApiError.fromResponse(res)
}
