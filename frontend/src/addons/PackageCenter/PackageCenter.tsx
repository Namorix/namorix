import React, { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAddonRoot,
  NmxCard,
  NmxCardBody,
  NmxCardFooter,
  NmxCardHeader,
  NmxGrid,
  NmxHorizontalWrap,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
  NmxRail,
  type NmxRailItemData,
  NmxRailList,
  NmxSearchInput,
  useActiveTab,
} from "@namorix/ui"
import {
  selectorExternalAddons,
  selectorExternalAddonsLoading,
  selectorExternalAddonsOrder,
  setAddonLoading,
  setAddons,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import {
  type AddonContainerStatus,
  type ExternalAddonManifest,
  nmxToast,
} from "@namorix/core"
import { addonController } from "../../controllers"

type Tab = "all" | "installed" | "updated"

const TABS: NmxRailItemData<Tab>[] = [
  {
    key: "all",
    icon: NmxIconFontSymbol.APPS,
    label: "addon.packageCenter.tabs.all",
  },
  {
    key: "installed",
    icon: NmxIconFontSymbol.CHECK,
    label: "addon.packageCenter.tabs.installed",
  },
  {
    key: "updated",
    icon: NmxIconFontSymbol.REFRESH,
    label: "addon.packageCenter.tabs.updated",
  },
]

const AddonGrid: React.FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const activeTab = useActiveTab<Tab>()
  const dispatch = useAppDispatch()

  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)
  const loading = useAppSelector(selectorExternalAddonsLoading)

  useEffect(() => {
    const load = async () => {
      dispatch(setAddonLoading(true))

      try {
        const list = await addonController.list()

        dispatch(
          setAddons(
            list.map(
              (dto) =>
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
                }) as ExternalAddonManifest,
            ),
          ),
        )
      } finally {
        dispatch(setAddonLoading(false))
      }
    }
    load().catch((err) => nmxToast.error(err))
  }, [dispatch])

  const addons = useMemo(() => {
    let items = externalAddonsOrder
      .map((id) => externalAddonsMap[id])
      .filter((a): a is ExternalAddonManifest => !!a)
    if (activeTab === "installed")
      items = items.filter(
        (a) => a.status === "running" || a.status === "stopped",
      )
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.id?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q),
      )
    }
    return items
  }, [activeTab, search, externalAddonsMap, externalAddonsOrder])

  return (
    <div className="nmx-addon-package-center__main">
      <NmxHorizontalWrap>
        <NmxSearchInput
          placeholder={t("addon.packageCenter.searchPlaceholder")}
          value={search}
          onChange={setSearch}
        />
      </NmxHorizontalWrap>
      <div className="nmx-addon-package-center__list">
        {loading ? (
          <p>{t("addon.packageCenter.loading")}</p>
        ) : addons.length === 0 ? (
          <p>{t("addon.packageCenter.empty")}</p>
        ) : (
          <NmxGrid cols={3}>
            {addons.map((addon) => (
              <NmxCard
                key={addon.id}
                className="nmx-addon-package-center__card"
              >
                <div className="nmx-addon-package-center__card-icon-title">
                  <NmxIconSvg
                    symbol={NmxIconSvgSymbol.APP_UNKNOWN}
                    className="nmx-addon-package-center__card-icon"
                  />
                  <NmxCardHeader
                    title={addon.name}
                    description={addon.version ?? "0.0.0"}
                    className="nmx-addon-package-center__card-header"
                    titleClassName="nmx-addon-package-center__card-title"
                    descriptionClassName="nmx-addon-package-center__card-description"
                  />
                </div>
                <NmxCardBody className="nmx-addon-package-center__card-body">
                  {addon.description}
                </NmxCardBody>
                <NmxCardFooter>{/* actions */}</NmxCardFooter>
              </NmxCard>
            ))}
          </NmxGrid>
        )}
      </div>
    </div>
  )
}

export const PackageCenter: React.FC = () => {
  const { t } = useTranslation()

  return (
    <NmxAddonRoot>
      <NmxRail<Tab> defaultTab="all">
        <NmxRailList items={TABS} t={t} />
        <AddonGrid />
      </NmxRail>
    </NmxAddonRoot>
  )
}
