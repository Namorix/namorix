import React, { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAddonRoot,
  NmxButton,
  NmxInlineAlert,
  NmxLoading,
} from "@namorix/ui"
import {
  useAppDispatch,
  useAppSelector,
  setAddons,
  setAddonLoading,
  setAddonInstalling,
  selectorExternalAddons,
  selectorExternalAddonsOrder,
  selectorExternalAddonsLoading,
  selectorExternalAddonsInstalling,
} from "../../store"
import { addonController } from "../../controllers"
import type { AddonContainerStatus } from "@namorix/core"

const STATUS_LABELS: Record<AddonContainerStatus, string> = {
  installed: "Installed",
  running: "Running",
  stopped: "Stopped",
  error: "Error",
}

const AddonCard: React.FC<{
  addon: {
    id: string
    displayName: string
    status: AddonContainerStatus
    image?: string
    hostPort?: number
    version?: string
    author?: string
  }
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRemove: (id: string) => void
  busy?: boolean
}> = ({ addon, onStart, onStop, onRemove, busy }) => (
  <div className={`nmx-addon-card nmx-addon-card--${addon.status}`}>
    <div className="nmx-addon-card__info">
      <span className="nmx-addon-card__name">{addon.displayName}</span>
      {addon.version && (
        <span className="nmx-addon-card__version">v{addon.version}</span>
      )}
      {addon.author && (
        <span className="nmx-addon-card__author">by {addon.author}</span>
      )}
      {addon.image && (
        <span className="nmx-addon-card__image">{addon.image}</span>
      )}
      {addon.hostPort && (
        <span className="nmx-addon-card__port">Port {addon.hostPort}</span>
      )}
    </div>
    <span className={`nmx-badge nmx-badge--${addon.status}`}>
      {STATUS_LABELS[addon.status] ?? addon.status}
    </span>
    <div className="nmx-addon-card__actions">
      {addon.status === "running" ? (
        <NmxButton
          size="sm"
          variant="outline"
          onClick={() => onStop(addon.id)}
          disabled={busy}
        >
          Stop
        </NmxButton>
      ) : (
        <NmxButton
          size="sm"
          variant="solid"
          onClick={() => onStart(addon.id)}
          disabled={busy}
        >
          Start
        </NmxButton>
      )}
      <NmxButton
        size="sm"
        variant="ghost"
        onClick={() => onRemove(addon.id)}
        disabled={busy}
      >
        Remove
      </NmxButton>
    </div>
  </div>
)

export const PackageCenter: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectorExternalAddons)
  const order = useAppSelector(selectorExternalAddonsOrder)
  const loading = useAppSelector(selectorExternalAddonsLoading)
  const installing = useAppSelector(selectorExternalAddonsInstalling)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    dispatch(setAddonLoading(true))
    addonController
      .list()
      .then((data) => dispatch(setAddons(data ?? [])))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load addons"),
      )
      .finally(() => dispatch(setAddonLoading(false)))
  }, [dispatch])

  const handleStart = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      await addonController.start(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start addon")
    } finally {
      setBusyId(null)
    }
  }

  const handleStop = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      await addonController.stop(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop addon")
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      await addonController.remove(id)
      dispatch(
        setAddons(
          order
            .filter((oid) => oid !== id)
            .map((oid) => items[oid]!)
            .filter(Boolean),
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove addon")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <NmxAddonRoot>
      {loading ? (
        <NmxLoading />
      ) : order.length === 0 ? (
        <p>No addons installed.</p>
      ) : (
        <div className="nmx-package-center__list">
          {order.map((id) => {
            const addon = items[id]
            if (!addon) return null
            return (
              <AddonCard
                key={id}
                addon={addon}
                onStart={handleStart}
                onStop={handleStop}
                onRemove={handleRemove}
                busy={busyId === id}
              />
            )
          })}
        </div>
      )}
    </NmxAddonRoot>
  )
}

// import React from "react"
// import { NmxAddonRoot } from "@namorix/ui"
//
// export const PackageCenter: React.FC = () => {
//   return <NmxAddonRoot></NmxAddonRoot>
// }
