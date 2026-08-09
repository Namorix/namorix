import React from "react"
import {
  cx,
  NmxBadge,
  NmxButton,
  NmxIconFont,
  NmxIconFontSymbol,
} from "@namorix/ui"
import { isDryRunActive, useDryRunClock } from "./useDryRunActive"

function formatDryRunRemaining(expiresAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - now) / 1000),
  )
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

export const DryRunCountdown: React.FC<{
  expiresAt: string | null | undefined
  onConfirm: () => void
  onCancel: () => void
  flexEnd?: boolean
}> = ({ expiresAt, onConfirm, onCancel, flexEnd }) => {
  const now = useDryRunClock(expiresAt)
  const active = isDryRunActive(expiresAt, now)

  return (
    <div
      className={cx("nmx-addon-frontgate__dry-run", {
        "nmx-addon-frontgate__dry-run--flex-end": flexEnd === true,
      })}
    >
      {!active ? (
        <span>—</span>
      ) : (
        <>
          <NmxBadge semantic="warning" size="sm">
            {formatDryRunRemaining(expiresAt ?? "", now)}
          </NmxBadge>
          <div className="nmx-addon-frontgate__btn-wrap">
            <NmxButton
              semantic="success"
              className="nmx-addon-frontgate__dry-run__btn"
              data-row-action
              onClick={(e) => {
                e.stopPropagation()
                onConfirm()
              }}
            >
              <NmxIconFont symbol={NmxIconFontSymbol.CHECK} size="xs" />
            </NmxButton>
            <NmxButton
              semantic="error"
              className="nmx-addon-frontgate__dry-run__btn"
              data-row-action
              onClick={(e) => {
                e.stopPropagation()
                onCancel()
              }}
            >
              <NmxIconFont symbol={NmxIconFontSymbol.UNDO} size="xs" />
            </NmxButton>
          </div>
        </>
      )}
    </div>
  )
}
