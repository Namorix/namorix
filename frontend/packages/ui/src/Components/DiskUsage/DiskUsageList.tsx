import React from "react"
import { DiskUsageItem } from "./DiskUsageItem"

export interface DiskUsageItemData {
  name: string
  totalBytes: number
  freeBytes: number
}

interface DiskUsageListProps {
  disks: DiskUsageItemData[]
}

export const DiskUsageList: React.FC<DiskUsageListProps> = ({ disks }) => (
  <div className="nmx-disk-list">
    {disks.map((d) => (
      <DiskUsageItem key={d.name} {...d} />
    ))}
  </div>
)
