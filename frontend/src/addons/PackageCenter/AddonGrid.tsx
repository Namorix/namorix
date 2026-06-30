import {
  type AddonCatalogEntry,
  type AddonContainerStatus,
  type ExternalAddonManifest,
  nmxToast,
} from "@namorix/core"
import { addonController } from "../../controllers"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { PackageCenterTab } from "./PackageCenter"
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
  NmxButtonRefresh,
  NmxCard,
  NmxCardBody,
  NmxCardFooter,
  NmxCardHeader,
  NmxGrid,
  NmxHorizontalWrap,
  NmxIconSvg,
  NmxIconSvgSymbol,
  NmxSearchInput,
  useActiveTab,
} from "@namorix/ui"

interface DisplayAddon {
  id: string
  name: string
  description?: string
  icon?: string
  version: string
  author?: string
  isInstalled: boolean
  status?: AddonContainerStatus
}

export const AddonGrid: React.FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [catalog, setCatalog] = useState<AddonCatalogEntry[]>([])
  const activeTab = useActiveTab<PackageCenterTab>()
  const dispatch = useAppDispatch()

  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)
  const loading = useAppSelector(selectorExternalAddonsLoading)

  const loadData = useCallback(async () => {
    dispatch(setAddonLoading(true))
    try {
      const [list, catalogList] = await Promise.all([
        addonController.list(),
        addonController.refreshCatalog(),
      ])

      setCatalog(catalogList)
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
  }, [dispatch])

  useEffect(() => {
    loadData().catch((err) => nmxToast.error(err))
  }, [loadData])

  const displayAddons = useMemo(() => {
    let items: DisplayAddon[] = []

    if (activeTab === "all") {
      const installedById = new Map(
        externalAddonsOrder.map((id) => [id, externalAddonsMap[id]]),
      )

      // Merge catalog entries with installed status
      for (const cat of catalog) {
        const installed = installedById.get(cat.id)
        items.push({
          id: cat.id,
          name: installed?.name ?? cat.name,
          description: installed?.description ?? cat.description,
          icon: installed?.icon ?? cat.icon,
          version: cat.version,
          author: installed?.author ?? cat.author,
          isInstalled: !!installed,
          status: installed?.status,
        })
      }

      // Add installed addons not in catalog (sideloaded)
      for (const id of externalAddonsOrder) {
        if (!catalog.some((c) => c.id === id)) {
          const inst = externalAddonsMap[id]
          if (inst)
            items.push({
              id: inst.id,
              name: inst.name,
              description: inst.description,
              icon: inst.icon,
              version: inst.version ?? "0.0.0",
              author: inst.author,
              isInstalled: true,
              status: inst.status,
            })
        }
      }
    } else {
      // "installed" / "updated" — current behavior
      items = externalAddonsOrder
        .map((id) => externalAddonsMap[id])
        .filter((a): a is ExternalAddonManifest => !!a)
        .map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          version: a.version ?? "0.0.0",
          author: a.author,
          isInstalled: true,
          status: a.status,
        }))

      if (activeTab === "installed")
        items = items.filter(
          (a) => a.status === "running" || a.status === "stopped",
        )
    }

    // Search filter
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
  }, [activeTab, search, catalog, externalAddonsMap, externalAddonsOrder])

  return (
    <div className="nmx-addon-package-center__main">
      <NmxHorizontalWrap>
        <NmxSearchInput
          placeholder={t("addon.packageCenter.searchPlaceholder")}
          value={search}
          onChange={setSearch}
        />
        <NmxButtonRefresh onClick={loadData} />
      </NmxHorizontalWrap>
      <div className="nmx-addon-package-center__list">
        {loading ? (
          <div className="nmx-addon-package-center__loading">
            <p>{t("addon.packageCenter.loading")}</p>
          </div>
        ) : displayAddons.length <= 0 ? (
          <div className="nmx-addon-package-center__empty">
            <p>{t("addon.packageCenter.empty")}</p>
          </div>
        ) : (
          <NmxGrid cols={3}>
            {displayAddons.map((addon) => (
              <NmxCard
                key={addon.id}
                className="nmx-addon-package-center__card"
              >
                <div className="nmx-addon-package-center__card-icon-title">
                  <NmxIconSvg
                    src={addon.icon}
                    symbol={NmxIconSvgSymbol.APP_UNKNOWN}
                    className="nmx-addon-package-center__card-icon"
                  />
                  <NmxCardHeader
                    title={addon.name}
                    description={addon.version}
                    className="nmx-addon-package-center__card-header"
                    titleClassName="nmx-addon-package-center__card-title"
                    descriptionClassName="nmx-addon-package-center__card-description"
                  />
                </div>
                <NmxCardBody className="nmx-addon-package-center__card-body">
                  {addon.description}
                </NmxCardBody>
                <NmxCardFooter>
                  {addon.isInstalled && addon.status && (
                    <span className="nmx-addon-package-center__status">
                      {addon.status}
                    </span>
                  )}
                </NmxCardFooter>
              </NmxCard>
            ))}
          </NmxGrid>
        )}
      </div>
    </div>
  )
}
