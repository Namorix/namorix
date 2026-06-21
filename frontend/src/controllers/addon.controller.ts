import { ApiAddonRoutes, nmxHttp, type ApiResponse } from "@namorix/core"

export interface AddonManifestDto {
  id: string
  displayName: string
  description?: string
  icon?: string
  image: string
  hostPort: number
  status: string
  version?: string
  author?: string
  installedAt: string
}

export interface InstallAddonDto {
  image: string
  containerPort?: number
  hostPort: number
  displayName?: string
  description?: string
  icon?: string
  version?: string
  author?: string
}

export const addonController = {
  async list() {
    const res = await nmxHttp
      .url(ApiAddonRoutes.list)
      .get()
      .json<ApiResponse<AddonManifestDto[]>>()
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async install(request: InstallAddonDto) {
    const res = await nmxHttp
      .url(ApiAddonRoutes.install)
      .post(request)
      .json<ApiResponse<AddonManifestDto>>()
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async start(id: string) {
    const res = await nmxHttp
      .url(ApiAddonRoutes.start(id))
      .post()
      .json<ApiResponse<null>>()
    if (!res.success) throw new Error(res.error)
  },

  async stop(id: string) {
    const res = await nmxHttp
      .url(ApiAddonRoutes.stop(id))
      .post()
      .json<ApiResponse<null>>()
    if (!res.success) throw new Error(res.error)
  },

  async remove(id: string) {
    const res = await nmxHttp
      .url(ApiAddonRoutes.remove(id))
      .delete()
      .json<ApiResponse<null>>()
    if (!res.success) throw new Error(res.error)
  },
}
