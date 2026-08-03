import {
  formatRelativeTime,
  nmxToast,
  semverCompare,
  markupToHtml,
} from "@namorix/core"
import { addonController, mapDtoToManifest } from "../../controllers"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { PackageCenterTab } from "./PackageCenter"
import {
  selectorCatalog,
  selectorExternalAddons,
  selectorExternalAddonsLoading,
  selectorExternalAddonsOrder,
  setAddonLoading,
  setAddons,
  setCatalog,
  useAppDispatch,
  useAppSelector,
} from "../../store"
import {
  cx,
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
  NmxMetaItem,
  NmxMetaList,
  NmxSearchInput,
  NmxSpinner,
  useActiveTab,
} from "@namorix/ui"
import { resolveAddonError } from "./addonError"
import { ServerSignalREvent, useServerSignalREvent } from "../../signalr"
import type {
  AddonContainerStatus,
  AddonPendingPhase,
  ExternalAddonManifest,
} from "../types"

interface DisplayAddon {
  id: string
  image?: string
  name: string
  description?: string
  icon?: string
  version: string
  author?: string
  isInstalled: boolean
  hasUpdate: boolean
  status?: AddonContainerStatus
  lastErrorCode?: string
  installedAt?: string
}

interface PendingAction {
  id: string
  taskPhase?: AddonPendingPhase
}

export const AddonGrid: React.FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [infoTarget, setInfoTarget] = useState<DisplayAddon | null>(null)
  const [pendingMap, setPendingMap] = useState<Record<string, PendingAction>>(
    {},
  )
  const [uninstallTarget, setUninstallTarget] = useState<DisplayAddon | null>(
    null,
  )
  const pendingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({})

  const activeTab = useActiveTab<PackageCenterTab>()
  const dispatch = useAppDispatch()

  const externalAddonsMap = useAppSelector(selectorExternalAddons)
  const externalAddonsOrder = useAppSelector(selectorExternalAddonsOrder)
  const loading = useAppSelector(selectorExternalAddonsLoading)
  const catalogRecord = useAppSelector(selectorCatalog)
  const catalog = useMemo(() => Object.values(catalogRecord), [catalogRecord])

  const installedCount = externalAddonsOrder.length
  const runningCount = useMemo(
    () =>
      externalAddonsOrder.filter(
        (id) => externalAddonsMap[id]?.status === "running",
      ).length,
    [externalAddonsOrder, externalAddonsMap],
  )
  const catalogAvailable = useMemo(
    () => catalog.filter((c) => !externalAddonsMap[c.id]).length,
    [catalog, externalAddonsMap],
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

      dispatch(setCatalog(catalogList))

      const addons = list.map(mapDtoToManifest)
      dispatch(setAddons(addons))

      const pendingRecovered: Record<string, PendingAction> = {}
      for (const a of addons) {
        if (a.pendingTaskId && a.pendingTaskPhase) {
          pendingRecovered[a.id] = {
            id: a.id,
            taskPhase: a.pendingTaskPhase,
          }
        }
      }

      setPendingMap(pendingRecovered)
    } finally {
      dispatch(setAddonLoading(false))
    }
  }, [dispatch])

  const clearPending = useCallback((id: string) => {
    if (pendingTimeoutsRef.current[id]) {
      clearTimeout(pendingTimeoutsRef.current[id])
      delete pendingTimeoutsRef.current[id]
    }

    setPendingMap((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const setPending = useCallback(
    (id: string, taskPhase: AddonPendingPhase) => {
      if (pendingTimeoutsRef.current[id]) {
        clearTimeout(pendingTimeoutsRef.current[id])
      }
      setPendingMap((prev) => ({
        ...prev,
        [id]: { id, taskPhase },
      }))

      pendingTimeoutsRef.current[id] = setTimeout(() => {
        clearPending(id)
        loadData().catch(() => {})
      }, 30_000)
    },
    [clearPending, loadData],
  )

  useEffect(() => {
    loadData().catch(nmxToast.error)
  }, [loadData])

  useServerSignalREvent<{ addonId: string; taskPhase: string | null }>(
    ServerSignalREvent.AddonPendingTaskChanged,
    (data) => {
      if (data.taskPhase) {
        setPending(data.addonId, data.taskPhase as AddonPendingPhase)
      } else {
        clearPending(data.addonId)
      }
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
          image: installed?.image ?? cat.image,
          name: installed?.name ?? cat.name,
          description: installed?.description ?? cat.description,
          icon: installed?.icon ?? cat.icon,
          version: installed?.version ?? cat.version,
          author: installed?.author ?? cat.author,
          isInstalled: !!installed,
          hasUpdate,
          status: installed?.status,
          installedAt: installed?.installedAt,
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
      e.stopPropagation()
      setPending(addon.id, "starting")

      addonController.start(addon.id).catch((err) => {
        clearPending(addon.id)
        nmxToast.error(resolveAddonError(t, err, addon.name))
      })
    },
    [clearPending, setPending, t],
  )

  const handleStop = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      e.stopPropagation()
      setPending(addon.id, "stopping")

      addonController.stop(addon.id).catch((err) => {
        clearPending(addon.id)
        nmxToast.error(resolveAddonError(t, err, addon.name))
      })
    },
    [clearPending, setPending, t],
  )

  const handleInstall = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      e.stopPropagation()
      setPending(addon.id, "installing")

      addonController
        .install({
          id: addon.id,
        })
        .catch((err) => {
          clearPending(addon.id)
          nmxToast.error(resolveAddonError(t, err, addon.name))
        })
    },
    [clearPending, setPending, t],
  )

  const handleUninstall = useCallback(
    (e: React.MouseEvent, addon: DisplayAddon) => {
      e.preventDefault()
      e.stopPropagation()
      setUninstallTarget(addon)
    },
    [],
  )

  const handleUninstallConfirm = useCallback(() => {
    if (!uninstallTarget) return
    const addon = uninstallTarget
    setUninstallTarget(null)

    setPending(addon.id, "uninstalling")

    addonController.remove(addon.id).catch((err) => {
      clearPending(addon.id)
      nmxToast.error(resolveAddonError(t, err, addon.name))
    })
  }, [uninstallTarget, setPending, clearPending, t])

  const resolvedPendingMap = useMemo(() => {
    const result: Record<string, PendingAction> = {}
    for (const id of Object.keys(pendingMap)) {
      const addon = externalAddonsMap[id]
      const phase = pendingMap[id]?.taskPhase

      if (!addon) {
        if (phase !== "uninstalling") result[id] = pendingMap[id]!
        continue
      }

      const isTerminal =
        (phase === "starting" && addon.status === "running") ||
        (phase === "stopping" && addon.status === "stopped") ||
        (phase === "installing" &&
          (addon.status === "installed" || addon.status === "running")) ||
        addon.status === "error"

      if (!isTerminal) {
        result[id] = pendingMap[id]!
      }
    }
    return result
  }, [pendingMap, externalAddonsMap])

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
                onClick={() => setInfoTarget(addon)}
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
                  {addon.isInstalled && addon.status !== "installed" && (
                    <NmxIconFont
                      symbol={
                        addon.status === "running"
                          ? NmxIconFontSymbol.PLAY
                          : addon.status === "error"
                            ? NmxIconFontSymbol.ERROR
                            : NmxIconFontSymbol.STOP
                      }
                      className={cx(
                        "nmx-addon-package-center__icon-status",
                        addon.status,
                      )}
                    />
                  )}
                </div>
                <NmxCardBody className="nmx-addon-package-center__card-body">
                  {addon.description}
                </NmxCardBody>
                <NmxCardFooter className="nmx-addon-package-center__card-footer">
                  {!addon.isInstalled && (
                    <NmxButton
                      fullWidth
                      className="nmx-addon-package-center__btn"
                      onClick={(e) => handleInstall(e, addon)}
                    >
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
                      semantic="default"
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
                {resolvedPendingMap[addon.id] && (
                  <div className="nmx-addon-package-center__card-overlay">
                    <div className="nmx-addon-package-center__card-overlay__content">
                      <NmxSpinner size="md" />
                      <span>
                        {t(
                          "addon.packageCenter.status." +
                            (pendingMap[addon.id]?.taskPhase ?? "unknown"),
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

      {!loading && installedCount > 0 && (
        <div className="nmx-addon-package-center__stats">
          {t("addon.packageCenter.stats", {
            installed: installedCount,
            running: runningCount,
            available: catalogAvailable,
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
            __html: markupToHtml(
              t("addon.packageCenter.uninstallConfirm", {
                name: uninstallTarget?.name,
              }),
            ),
          }}
        />
      </NmxAlertDialog>

      <NmxAlertDialog
        open={!!infoTarget}
        title={infoTarget?.name ?? ""}
        icon={
          <NmxIconSvg
            src={infoTarget?.icon}
            symbol={NmxIconSvgSymbol.APP_UNKNOWN}
            className="nmx-addon-package-center__info-dialog-icon"
          />
        }
        size="lg"
        onClose={() => setInfoTarget(null)}
      >
        {infoTarget && (
          <div className="nmx-addon-package-center__info-dialog">
            <NmxMetaList>
              <NmxMetaItem
                label={t("addon.packageCenter.infoLabels.id")}
                value={infoTarget.id}
              />
              <NmxMetaItem
                label={t("addon.packageCenter.infoLabels.version")}
                value={infoTarget.version}
              />
              <NmxMetaItem
                label={t("addon.packageCenter.infoLabels.author")}
                value={infoTarget.author ?? "—"}
              />
              {infoTarget.isInstalled && (
                <NmxMetaItem
                  label={t("addon.packageCenter.infoLabels.status")}
                  value={infoTarget.status ?? "—"}
                />
              )}
              <NmxMetaItem
                label={t("addon.packageCenter.infoLabels.image")}
                value={infoTarget.image ?? "—"}
              />
              {infoTarget.isInstalled && (
                <NmxMetaItem
                  label={t("addon.packageCenter.infoLabels.installedAt")}
                  value={
                    infoTarget.installedAt
                      ? formatRelativeTime(infoTarget.installedAt, t)
                      : "—"
                  }
                />
              )}
              <NmxMetaItem
                label={t("addon.packageCenter.infoLabels.description")}
                value={infoTarget.description ?? "—"}
              />
            </NmxMetaList>
          </div>
        )}
      </NmxAlertDialog>
    </div>
  )
}
