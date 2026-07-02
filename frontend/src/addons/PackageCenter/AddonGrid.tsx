import {
  type AddonCatalogEntry,
  type AddonContainerStatus,
  type AddonStatusPayload,
  type ExternalAddonManifest,
  nmxToast,
  semverCompare,
  toHtml,
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
  updateAddonStatus,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import {
  NmxAlertDialog,
  NmxButton,
  NmxButtonRefresh,
  NmxCard,
  NmxCardBody,
  NmxCardFooter,
  NmxCardHeader,
  NmxGrid,
  NmxHorizontalWrap,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxIconSvg,
  NmxIconSvgSymbol,
  NmxSearchInput,
  NmxSpinner,
  useActiveTab,
} from "@namorix/ui"
import { resolveAddonError } from "./addonError"
import { ServerSignalREvent, useServerSignalREvent } from "../../signalr"

interface DisplayAddon {
  id: string
  name: string
  description?: string
  icon?: string
  version: string
  author?: string
  isInstalled: boolean
  hasUpdate: boolean
  status?: AddonContainerStatus
}

type PendingStatus = "starting" | "stopping" | "uninstalling"

interface PendingAction {
  id: string
  status?: PendingStatus
}

export const AddonGrid: React.FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [catalog, setCatalog] = useState<AddonCatalogEntry[]>([])
  const [pendingMap, setPendingMap] = useState<Record<string, PendingAction>>(
    {},
  )
  const [uninstallTarget, setUninstallTarget] = useState<DisplayAddon | null>(
    null,
  )

  const activeTab = useActiveTab<PackageCenterTab>()
  const dispatch = useAppDispatch()

  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)
  const loading = useAppSelector(selectorExternalAddonsLoading)

  const totalInstalled = externalAddonsOrder.length
  const runningCount = useMemo(
    () =>
      externalAddonsOrder.filter(
        (id) => externalAddonsMap[id]?.status === "running",
      ).length,
    [externalAddonsOrder, externalAddonsMap],
  )

  const catalogById = useMemo(
    () => new Map(catalog.map((c) => [c.id, c])),
    [catalog],
  )

  const loadData = useCallback(async () => {
    dispatch(setAddonLoading(true))

    try {
      const [list, catalogList] = await Promise.all([
        addonController.list(),
        addonController.refreshCatalog(),
      ])

      setCatalog(catalogList)
      const addons = list.map(
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
            pendingTaskId: dto.pendingTaskId,
          }) as ExternalAddonManifest,
      )

      dispatch(setAddons(addons))

      const pendingRecovered: Record<string, PendingAction> = {}
      for (const a of addons) {
        if (a.pendingTaskId) {
          let status: PendingStatus = "stopping"
          switch (a.status) {
            case "uninstalling":
              status = "uninstalling"
          }

          pendingRecovered[a.id] = {
            id: a.id,
            status,
          }
        }
      }

      setPendingMap(pendingRecovered)
    } finally {
      dispatch(setAddonLoading(false))
    }
  }, [dispatch])

  useEffect(() => {
    loadData().catch((err) => nmxToast.error(err))
  }, [loadData])

  useServerSignalREvent<AddonStatusPayload>(
    ServerSignalREvent.AddonStatusChanged,
    (data) => {
      dispatch(
        updateAddonStatus({ addonId: data.addonId, status: data.status }),
      )

      setPendingMap((prev) => {
        const n = { ...prev }
        delete n[data.addonId]
        return n
      })
    },
  )

  const displayAddons = useMemo(() => {
    let items: DisplayAddon[] = []

    if (activeTab === "all") {
      const installedById = new Map(
        externalAddonsOrder.map((id) => [id, externalAddonsMap[id]]),
      )

      // Merge catalog entries with installed status
      for (const cat of catalog) {
        const installed = installedById.get(cat.id)
        const installedVersion = installed?.version
        const hasUpdate = !!(
          installedVersion && semverCompare(cat.version, installedVersion) > 0
        )

        items.push({
          id: cat.id,
          name: installed?.name ?? cat.name,
          description: installed?.description ?? cat.description,
          icon: installed?.icon ?? cat.icon,
          version: cat.version,
          author: installed?.author ?? cat.author,
          isInstalled: !!installed,
          hasUpdate,
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
              hasUpdate: false,
              status: inst.status,
            })
        }
      }

      items.sort((a, b) => {
        if (a.isInstalled !== b.isInstalled) {
          return a.isInstalled ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    } else {
      items = externalAddonsOrder
        .map((id) => externalAddonsMap[id])
        .filter((a): a is ExternalAddonManifest => !!a)
        .map((a) => {
          const catalogEntry = a.version ? catalogById.get(a.id) : undefined
          const version = a.version ?? "0.0.0"
          const hasUpdate = !!(
            catalogEntry?.version &&
            semverCompare(catalogEntry.version, version) > 0
          )

          return {
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            version,
            author: a.author,
            isInstalled: true,
            hasUpdate,
            status: a.status,
          }
        })

      if (activeTab === "updated") {
        items = items.filter((a) => a.hasUpdate)
      }

      items.sort((a, b) => {
        return a.name.localeCompare(b.name)
      })
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
  }, [
    activeTab,
    search,
    externalAddonsOrder,
    externalAddonsMap,
    catalog,
    catalogById,
  ])

  const handleStart = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      setPendingMap((prev) => ({
        ...prev,
        [addon.id]: {
          id: addon.id,
          status: "starting",
        },
      }))

      addonController.start(addon.id).catch((err) => {
        setPendingMap((prev) => {
          const n = { ...prev }
          delete n[addon.id]
          return n
        })
        nmxToast.error(resolveAddonError(t, err, addon.name))
      })
    },
    [t],
  )

  const handleStop = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      setPendingMap((prev) => ({
        ...prev,
        [addon.id]: { id: addon.id, status: "stopping" },
      }))

      addonController.stop(addon.id).catch((err) => {
        setPendingMap((prev) => {
          const n = { ...prev }
          delete n[addon.id]
          return n
        })
        nmxToast.error(resolveAddonError(t, err, addon.name))
      })
    },
    [t],
  )

  const handleUninstall = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      setUninstallTarget(addon)
    },
    [],
  )

  const handleUninstallConfirm = useCallback(() => {
    if (!uninstallTarget) return
    const target = uninstallTarget
    setUninstallTarget(null)

    setPendingMap((prev) => ({
      ...prev,
      [target.id]: {
        id: target.id,
        status: "uninstalling",
      },
    }))

    addonController.remove(target.id).catch((err) => {
      setPendingMap((prev) => {
        const n = { ...prev }
        delete n[target.id]
        return n
      })
      nmxToast.error(resolveAddonError(t, err, target.name))
    })
  }, [uninstallTarget, t])

  return (
    <div className="nmx-addon-package-center__main">
      <NmxHorizontalWrap className="nmx-addon-package-center__horizontal-wrap">
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
          <NmxGrid cols={3} minColWidth={240}>
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
                <NmxCardFooter className="nmx-addon-package-center__card-footer">
                  {!addon.isInstalled && (
                    <NmxButton fullWidth>
                      <NmxIconFont symbol={NmxIconFontSymbol.INSTALL} />
                      <span className="nmx-addon-package-center__btn-label">
                        {t("addon.packageCenter.actions.install")}
                      </span>
                    </NmxButton>
                  )}
                  {addon.isInstalled && addon.status !== "running" && (
                    <NmxButton
                      semantic="success"
                      className="nmx-addon-package-center__btn"
                      onClick={(e) => handleStart(e, addon)}
                    >
                      <NmxIconFont symbol={NmxIconFontSymbol.PLAY} />
                      <span className="nmx-addon-package-center__btn-label">
                        {t("addon.packageCenter.actions.start")}
                      </span>
                    </NmxButton>
                  )}
                  {addon.isInstalled && addon.status === "running" && (
                    <NmxButton
                      semantic="success"
                      uppercase
                      className="nmx-addon-package-center__btn"
                      onClick={(e) => handleStop(e, addon)}
                    >
                      <NmxIconFont symbol={NmxIconFontSymbol.STOP} />
                      <span className="nmx-addon-package-center__btn-label">
                        {t("addon.packageCenter.actions.stop")}
                      </span>
                    </NmxButton>
                  )}
                  {addon.hasUpdate && (
                    <NmxButton
                      semantic="warning"
                      className="nmx-addon-package-center__btn"
                    >
                      <NmxIconFont symbol={NmxIconFontSymbol.UPDATE} />
                      <span className="nmx-addon-package-center__btn-label">
                        {t("addon.packageCenter.actions.update")}
                      </span>
                    </NmxButton>
                  )}
                  {addon.isInstalled && (
                    <NmxButton
                      semantic="error"
                      variant="outline"
                      className="nmx-addon-package-center__btn"
                      onClick={(e) => handleUninstall(e, addon)}
                    >
                      <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
                      <span className="nmx-addon-package-center__btn-label">
                        {t("addon.packageCenter.actions.uninstall")}
                      </span>
                    </NmxButton>
                  )}
                </NmxCardFooter>
                {pendingMap[addon.id] && (
                  <div className="nmx-addon-package-center__card-overlay">
                    <div className="nmx-addon-package-center__card-overlay__content">
                      <NmxSpinner size="md" />
                      <span>
                        {t(
                          "addon.packageCenter.status." +
                            (pendingMap[addon.id]?.status ?? "unknown"),
                        )}
                      </span>
                    </div>
                    <NmxButton
                      semantic="error"
                      variant="ghost"
                      uppercase
                      className="nmx-addon-package-center__card-overlay__cancel"
                    >
                      {t("addon.packageCenter.cancelAction")}
                    </NmxButton>
                  </div>
                )}
              </NmxCard>
            ))}
          </NmxGrid>
        )}
      </div>

      {!loading && totalInstalled > 0 && (
        <div className="nmx-addon-package-center__stats">
          {t("addon.packageCenter.stats", {
            total: totalInstalled,
            running: runningCount,
            stopped: totalInstalled - runningCount,
          })}
        </div>
      )}

      <NmxAlertDialog
        open={!!uninstallTarget}
        title={t("addon.packageCenter.uninstallTitle")}
        confirmLabel={t("addon.packageCenter.actions.uninstall")}
        onConfirm={handleUninstallConfirm}
        onCancel={() => setUninstallTarget(null)}
        onClose={() => setUninstallTarget(null)}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: toHtml(
              t("addon.packageCenter.uninstallConfirm", {
                name: uninstallTarget?.name,
              }),
            ),
          }}
        />
      </NmxAlertDialog>
    </div>
  )
}
