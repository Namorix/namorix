import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { AddonModeProvider } from "./host"
import {
  createOauth,
  type OAuthService,
  OAUTH_PARAMS,
  OAUTH_WELL_KNOWN_PATH,
} from "../oauth"
import { createNmxCore } from "../config"

export interface CreateMountContext {
  mode?: string
  oauthClientId?: string
  oauthAuthorizeUrl?: string
  oauthTokenUrl?: string
  redirectUri?: string
}

interface WellKnownOAuthConfig {
  authorizeUrl: string
  tokenUrl: string
  clientId: string
  redirectUri: string
}

export function createMount(
  Component: React.ComponentType<object>,
  deps?: { oauth?: OAuthService },
): (
  container: HTMLElement,
  context?: CreateMountContext,
) => Promise<() => void> {
  // Each app (shell/addon) passes its own oauth service (config-bound).
  // If not passed, it instantiates its own instance within the closure — it is not a global state,
  // so there are no conflicts when sharing modules via federation.

  const oauth = deps?.oauth ?? createOauth(createNmxCore())
  const rootMap = new WeakMap<HTMLElement, Root>()

  return async (container: HTMLElement, context?: CreateMountContext) => {
    const isStandalone = context?.mode !== "widget"
    const render = () => {
      const root = createRoot(container)
      rootMap.set(container, root)
      root.render(
        <AddonModeProvider value={isStandalone ? "standalone" : "widget"}>
          <Component />
        </AddonModeProvider>,
      )
    }

    const { oauthClientId, oauthAuthorizeUrl, oauthTokenUrl, redirectUri } =
      context ?? {}
    const oauthConfig =
      oauthClientId && oauthAuthorizeUrl
        ? {
            authorizeUrl: oauthAuthorizeUrl,
            tokenUrl: oauthTokenUrl ?? "",
            clientId: oauthClientId,
            redirectUri: redirectUri ?? window.location.origin,
          }
        : isStandalone
          ? await discoverWellKnown().then((cfg) =>
              cfg ? { ...cfg, redirectUri: window.location.origin } : null,
            )
          : null

    if (oauthConfig) {
      const params = new URLSearchParams(window.location.search)
      const code = params.get(OAUTH_PARAMS.code)
      const state = params.get(OAUTH_PARAMS.state)

      if (code && state && oauthConfig.tokenUrl) {
        await oauth.handleRedirectCallback(
          oauthConfig.tokenUrl,
          oauthConfig.clientId,
          oauthConfig.redirectUri,
        )
        window.history.replaceState({}, "", window.location.pathname)
        render()
        return () => {}
      }

      if (!oauth.getAccessToken()) {
        const desktopUrl = oauthConfig.tokenUrl.replace("/api/oauth/token", "")
        const refreshed = await oauth.trySilentRefresh(desktopUrl)
        if (refreshed) {
          render()
          return () => {}
        }

        void oauth.authorizeRedirect(
          oauthConfig.authorizeUrl,
          oauthConfig.clientId,
          oauthConfig.redirectUri,
        )
        return () => {}
      }
    }

    render()
    return () => {
      const root = rootMap.get(container)
      if (root) {
        root.unmount()
        rootMap.delete(container)
      }
    }
  }
}

async function discoverWellKnown(): Promise<WellKnownOAuthConfig | null> {
  try {
    const res = await fetch(OAUTH_WELL_KNOWN_PATH)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
