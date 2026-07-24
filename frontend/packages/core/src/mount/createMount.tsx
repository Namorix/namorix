import React from "react"
import { createRoot, type Root } from "react-dom/client"
import { AddonModeProvider } from "./host"
import {
  authorizeRedirect,
  getAccessToken,
  handleRedirectCallback,
  OAUTH_PARAMS,
} from "../oauth"

export interface CreateMountContext {
  mode?: string
  oauthClientId?: string
  oauthAuthorizeUrl?: string
  oauthTokenUrl?: string
  redirectUri?: string
}

export function createMount(
  Component: React.ComponentType<object>,
): (container: HTMLElement, context?: CreateMountContext) => () => void {
  const rootMap = new WeakMap<HTMLElement, Root>()

  return (container: HTMLElement, context?: CreateMountContext) => {
    const isStandalone = context?.mode !== "widget"
    const { oauthClientId, oauthAuthorizeUrl, oauthTokenUrl, redirectUri } =
      context ?? {}
    const canOAuth = isStandalone && oauthClientId && oauthAuthorizeUrl

    console.log("Mode:", isStandalone, "CanOAuth: ", canOAuth)
    const render = () => {
      const root = createRoot(container)
      rootMap.set(container, root)
      root.render(
        <AddonModeProvider value={isStandalone ? "standalone" : "widget"}>
          <Component />
        </AddonModeProvider>,
      )
    }

    if (canOAuth) {
      const params = new URLSearchParams(window.location.search)
      const code = params.get(OAUTH_PARAMS.code)
      const state = params.get(OAUTH_PARAMS.state)

      if (code && state && oauthTokenUrl) {
        handleRedirectCallback(
          oauthTokenUrl,
          oauthClientId,
          redirectUri ?? window.location.origin,
        ).then(() => {
          window.history.replaceState({}, "", window.location.pathname)
          render()
        })
        return () => {}
      }

      if (!getAccessToken()) {
        void authorizeRedirect(
          oauthAuthorizeUrl,
          oauthClientId,
          redirectUri ?? window.location.origin,
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
