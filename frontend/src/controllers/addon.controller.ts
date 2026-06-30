import { ApiAddonRoutes, nmxHttp } from "@namorix/core"

export interface AddonManifestDto {
  id: string
  name: string
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
  name?: string
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
      .json<AddonManifestDto[]>()
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async install(request: InstallAddonDto) {
    const res = await nmxHttp
      .url(ApiAddonRoutes.install)
      .post(request)
      .json<AddonManifestDto>()
    if (!res.success) throw new Error(res.error)
    return res.data
  },

  async start(id: string) {
    const res = await nmxHttp.url(ApiAddonRoutes.start(id)).post().json()
    if (!res.success) throw new Error(res.error)
  },

  async stop(id: string) {
    const res = await nmxHttp.url(ApiAddonRoutes.stop(id)).post().json()
    if (!res.success) throw new Error(res.error)
  },

  async remove(id: string) {
    const res = await nmxHttp.url(ApiAddonRoutes.remove(id)).delete().json()
    if (!res.success) throw new Error(res.error)
  },
}
