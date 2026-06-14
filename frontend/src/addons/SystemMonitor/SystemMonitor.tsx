import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxStatCard,
  NmxGrid,
  NmxAddonRoot,
  NmxIconFontSymbol,
  NmxSection,
  NmxMetaList,
  NmxMetaItem,
  DiskUsageList,
  type DiskUsageItemData,
} from "@namorix/ui"
import {
  ServerSignalREvent,
  ServerSignalRGroups,
  useServerSignalREvent,
  useServerSignalRGroup,
} from "../../signalr"
import { formatBytes, formatBytesSec, formatUptime } from "@namorix/core"

export interface DiskData {
  name: string
  total: number
  free: number
}

interface SystemStats {
  cpu: number
  cpuHistory: number[]
  cpuProcess: number
  cpuProcessHistory: number[]
  memory: {
    total: number
    available: number
    usedPct: number
  }
  memoryHistory: number[]
  process: {
    rss: number
    heap: number
    total: number
  }
  processMemoryHistory: number[]
  threads: number
  uptime: number
  environment: {
    os: string
    framework: string
    machine: string
    cores: number
  }
  disk: DiskData[]
  diskIo: {
    readBytesPerSec: number
    writeBytesPerSec: number
  }
  networkIo: {
    rxBytesPerSec: number
    txBytesPerSec: number
  }
}

export const SystemMonitor: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<SystemStats | null>(null)

  useServerSignalRGroup(ServerSignalRGroups.SystemMonitor, true)
  useServerSignalREvent<SystemStats>(
    ServerSignalREvent.SystemMonitorStatsUpdate,
    setStats,
  )

  const diskItems: DiskUsageItemData[] =
    stats?.disk.map((d) => ({
      name: d.name,
      totalBytes: d.total,
      freeBytes: d.free,
    })) ?? []

  return (
    <NmxAddonRoot scrolled className="nmx-addon-system-monitor">
      <NmxSection label={t("addon.systemMonitor.processSection")}>
        <NmxGrid cols={2}>
          <NmxStatCard
            label={t("addon.systemMonitor.cpu")}
            icon={NmxIconFontSymbol.CPU}
            value={stats?.cpu != null ? `${stats.cpu.toFixed(1)}%` : null}
            sparkData={stats?.cpuHistory}
            description={t("addon.systemMonitor.cpuDescription", {
              count: stats?.environment.cores ?? 0,
            })}
            thresholdEnabled={true}
          />
          <NmxStatCard
            label={t("addon.systemMonitor.cpuProcess")}
            icon={NmxIconFontSymbol.CPU}
            value={
              stats?.cpuProcess != null
                ? `${stats.cpuProcess.toFixed(1)}%`
                : null
            }
            sparkData={stats?.cpuProcessHistory}
            description={t("addon.systemMonitor.cpuProcessDescription", {
              count: stats?.environment.cores ?? 0,
            })}
            thresholdEnabled={true}
          />
        </NmxGrid>
      </NmxSection>
      <NmxSection label={t("addon.systemMonitor.memorySection")}>
        <NmxGrid cols={2}>
          <NmxStatCard
            label={t("addon.systemMonitor.memory")}
            icon={NmxIconFontSymbol.RAM}
            value={
              stats?.memory.usedPct != null ? `${stats.memory.usedPct}%` : null
            }
            sparkData={stats?.memoryHistory}
            description={t("addon.systemMonitor.memoryDescription", {
              used: formatBytes(
                stats ? stats.memory.total - stats.memory.available : 0,
              ),
              total: formatBytes(stats?.memory.total ?? 0),
            })}
            thresholdEnabled={true}
          />
          <NmxStatCard
            label={t("addon.systemMonitor.processMemory")}
            icon={NmxIconFontSymbol.RAM}
            value={formatBytes(stats?.process.rss ?? 0)}
            sparkData={stats?.processMemoryHistory}
            description={t("addon.systemMonitor.processMemoryDescription", {
              heap: formatBytes(stats?.process.heap ?? 0),
              total: formatBytes(stats?.process.total ?? 0),
            })}
            thresholdEnabled={true}
          />
        </NmxGrid>
      </NmxSection>
      <NmxSection label={t("addon.systemMonitor.diskSpaceSection")}>
        {stats?.disk && <DiskUsageList disks={diskItems} />}
      </NmxSection>
      <NmxSection label={t("addon.systemMonitor.ioSection")}>
        <NmxGrid cols={4}>
          <NmxStatCard
            label={t("addon.systemMonitor.diskRead")}
            icon={NmxIconFontSymbol.ARROW_BAR_DOWN}
            value={
              formatBytesSec(stats?.diskIo.readBytesPerSec ?? 0) ??
              t("addon.systemMonitor.unknown")
            }
          />
          <NmxStatCard
            label={t("addon.systemMonitor.diskWrite")}
            icon={NmxIconFontSymbol.ARROW_BAR_UP}
            value={
              formatBytesSec(stats?.diskIo.writeBytesPerSec ?? 0) ??
              t("addon.systemMonitor.unknown")
            }
          />
          <NmxStatCard
            label={t("addon.systemMonitor.networkRx")}
            icon={NmxIconFontSymbol.ARROW_BAR_DOWN}
            value={
              formatBytesSec(stats?.networkIo.rxBytesPerSec ?? 0) ??
              t("addon.systemMonitor.unknown")
            }
          />
          <NmxStatCard
            label={t("addon.systemMonitor.networkTx")}
            icon={NmxIconFontSymbol.ARROW_BAR_UP}
            value={
              formatBytesSec(stats?.networkIo.txBytesPerSec) ??
              t("addon.systemMonitor.unknown")
            }
          />
        </NmxGrid>
      </NmxSection>
      <NmxSection label={t("addon.systemMonitor.environmentSection")}>
        <NmxMetaList contained>
          <NmxMetaItem
            label={t("addon.systemMonitor.machine")}
            value={
              stats?.environment.machine ?? t("addon.systemMonitor.unknown")
            }
            alignValue="end"
          />
          <NmxMetaItem
            label={t("addon.systemMonitor.os")}
            value={stats?.environment.os ?? t("addon.systemMonitor.unknown")}
            alignValue="end"
          />
          <NmxMetaItem
            label={t("addon.systemMonitor.framework")}
            value={
              stats?.environment.framework ?? t("addon.systemMonitor.unknown")
            }
            alignValue="end"
          />
          <NmxMetaItem
            label={t("addon.systemMonitor.uptime")}
            value={
              formatUptime(stats?.uptime ?? 0) ??
              t("addon.systemMonitor.unknown")
            }
            alignValue="end"
          />
        </NmxMetaList>
      </NmxSection>
    </NmxAddonRoot>
  )
}
