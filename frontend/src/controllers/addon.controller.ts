import { ApiAddonRoutes, ApiError } from "@namorix/core"
import type {
  AddonCatalogEntry,
  AddonContainerStatus,
  AddonPendingPhase,
  ExternalAddonManifest,
} from "../addons"
import { coreConfig } from "../config/coreConfig"

export interface AddonManifestDto {
  id: string
  name: string
  description?: string
  icon?: string
  image: string
  hostPort: number
  port?: string
  status: string
  version?: string
  author?: string
  installedAt: string
  pendingTaskId?: string
  pendingTaskPhase?: string
  lastErrorCode?: string
}

export interface InstallAddonDto {
  id: string
}

export const addonController = {
  async list() {
    const res = await coreConfig.http
      .url(ApiAddonRoutes.list)
      .get()
      .json<AddonManifestDto[]>()
    if (!res.success) throw ApiError.fromResponse(res)
    return res.data
  },

  async install(request: InstallAddonDto) {
    const res = await coreConfig.http
      .url(ApiAddonRoutes.install)
      .post(request)
      .json<AddonManifestDto>()
    if (!res.success) throw ApiError.fromResponse(res)
    return res.data
  },

  async start(id: string) {
    const res = await coreConfig.http
      .url(ApiAddonRoutes.start(id))
      .post()
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
  },

  async stop(id: string) {
    const res = await coreConfig.http.url(ApiAddonRoutes.stop(id)).post().json()
    if (!res.success) throw ApiError.fromResponse(res)
  },

  async remove(id: string) {
    const res = await coreConfig.http
      .url(ApiAddonRoutes.remove(id))
      .delete()
      .json()
    if (!res.success) throw ApiError.fromResponse(res)
  },

  async refreshCatalog(): Promise<AddonCatalogEntry[]> {
    const res = await coreConfig.http
      .url(ApiAddonRoutes.syncCatalog)
      .post()
      .json<AddonCatalogEntry[]>()
    if (!res.success) throw ApiError.fromResponse(res)
    return res.data
  },
}

export const mapDtoToManifest = (
  dto: AddonManifestDto,
): ExternalAddonManifest =>
  ({
    id: dto.id,
    name: dto.name,
    description: dto.description,
    icon: dto.icon,
    image: dto.image,
    hostPort: dto.hostPort,
    status: dto.status as AddonContainerStatus,
    version: dto.version,
    author: dto.author,
    installedAt: dto.installedAt,
    pendingTaskId: dto.pendingTaskId,
    pendingTaskPhase: dto.pendingTaskPhase as AddonPendingPhase,
    lastErrorCode: dto.lastErrorCode,
  }) as ExternalAddonManifest
