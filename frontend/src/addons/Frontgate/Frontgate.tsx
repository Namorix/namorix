import React from "react"
import {
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxToolbar,
  NmxToolbarContent,
  NmxToolbarHeader,
  type NmxToolbarItemData,
  NmxToolbarList,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { FrontgateReverseProxy } from "./FrontgateReverseProxy"
import { FrontgateCertificate } from "./FrontgateCertificate"
import { FrontgateErrorPages } from "./FrontgateErrorPages"
import { FrontgateAccessPolicy } from "./FrontgateAccessPolicy"

export type FrontgateTab =
  | "reverseProxy"
  | "certificate"
  | "errorPages"
  | "accessPolicy"

const TABS: NmxToolbarItemData<FrontgateTab>[] = [
  {
    key: "reverseProxy",
    icon: NmxIconFontSymbol.REVERSE_PROXY,
    label: "addon.frontgate.tabs.reverseProxy",
  },
  {
    key: "certificate",
    icon: NmxIconFontSymbol.LOCK,
    label: "addon.frontgate.tabs.certificate",
  },
  {
    key: "accessPolicy",
    icon: NmxIconFontSymbol.SECURITY,
    label: "addon.frontgate.tabs.accessPolicy",
  },
  {
    key: "errorPages",
    icon: NmxIconFontSymbol.ERROR_PAGE,
    label: "addon.frontgate.tabs.errorPages",
  },
]

export const Frontgate: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NmxAddonRoot>
      <NmxToolbar<FrontgateTab> defaultTab="reverseProxy">
        <NmxToolbarHeader>
          <NmxToolbarList items={TABS} t={t} />
        </NmxToolbarHeader>
        <NmxToolbarContent<FrontgateTab> tabKey="reverseProxy">
          <FrontgateReverseProxy />
        </NmxToolbarContent>
        <NmxToolbarContent<FrontgateTab> tabKey="certificate">
          <FrontgateCertificate />
        </NmxToolbarContent>
        <NmxToolbarContent<FrontgateTab> tabKey="accessPolicy">
          <FrontgateAccessPolicy />
        </NmxToolbarContent>
        <NmxToolbarContent<FrontgateTab> tabKey="errorPages">
          <FrontgateErrorPages />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
