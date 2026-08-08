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
import { FrontgateAccessPolicy } from "./FrontgateAccessPolicy"
import { FrontgateAudit } from "./FrontgateAudit"

export type FrontgateTab =
  | "reverseProxy"
  | "certificate"
  | "errorPages"
  | "accessPolicy"
  | "audit"

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
    key: "audit",
    icon: NmxIconFontSymbol.ACTIVITY,
    label: "addon.frontgate.tabs.audit",
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
        <NmxToolbarContent<FrontgateTab> tabKey="audit">
          <FrontgateAudit />
        </NmxToolbarContent>
      </NmxToolbar>
    </NmxAddonRoot>
  )
}
