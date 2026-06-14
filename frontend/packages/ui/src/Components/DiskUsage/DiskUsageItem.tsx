import React from "react"
import { NmxBadge, cx } from "@namorix/ui"
import { formatBytes } from "@namorix/core"

interface DiskUsageItemProps {
  name: string
  totalBytes: number
  freeBytes: number
}

export const DiskUsageItem: React.FC<DiskUsageItemProps> = ({
  name,
  totalBytes,
  freeBytes,
}) => {
  const used = totalBytes - freeBytes
  const pct = totalBytes > 0 ? (used / totalBytes) * 100 : 0
  const semantic = pct > 90 ? "error" : pct > 70 ? "warning" : "success"

  return (
    <div className="nmx-disk-item">
      <span className="nmx-disk-item__name">{name}</span>
      <div className="nmx-disk-item__bar">
        <div
          className={cx(
            "nmx-disk-item__fill",
            `nmx-disk-item__fill--${semantic}`,
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="nmx-disk-item__info">
        {formatBytes(used)} / {formatBytes(totalBytes)}
      </span>
      <NmxBadge semantic={semantic} size="sm">
        {pct.toFixed(0)}%
      </NmxBadge>
    </div>
  )
}
