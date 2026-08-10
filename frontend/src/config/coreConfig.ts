import {
  createNmxCore,
  createAuthRefresh,
  createHttpClient,
  createAuthService,
  createThemeLoader,
  createSignalrService,
  createSignalRHooks,
} from "@namorix/core"

const config = createNmxCore({
  apiBaseUrl: import.meta.env.VITE_API_URL ?? window.location.origin,
  hubsPath: "/hubs/namorix",
  isShellDesktop: true,
})

const authRefresh = createAuthRefresh(config)
const http = createHttpClient(authRefresh)
const auth = createAuthService({ core: config, http })
const theme = createThemeLoader(config)
const signalr = createSignalrService({ core: config, authRefresh })
const signalRHooks = createSignalRHooks(signalr)

export const coreConfig = {
  ...config,
  http: http,
  authRefresh,
  auth,
  theme,
  signalr,
  signalRHooks,
}
