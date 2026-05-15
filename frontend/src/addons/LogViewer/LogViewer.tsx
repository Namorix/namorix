import React from "react"
import { useTranslation } from "react-i18next"
import "./LogViewer.scss"

interface LogEntry {
  time: string
  level: "info" | "warn" | "error" | "debug"
  source: string
  message: string
}

const MOCK_LOGS: LogEntry[] = [
  {
    time: "2026-05-15 10:00:01",
    level: "info",
    source: "system",
    message: "System started",
  },
  {
    time: "2026-05-15 10:00:02",
    level: "info",
    source: "auth",
    message: "Session initialized",
  },
  {
    time: "2026-05-15 10:00:05",
    level: "warn",
    source: "network",
    message: "Slow response from upstream",
  },
]

export const LogViewer: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="nmx-log-viewer">
      <div className="nmx-log-viewer__toolbar">
        <select className="nmx-log-viewer__source-filter">
          <option value="">{t("addon.log-viewer.allSources")}</option>
          <option value="system">system</option>
          <option value="auth">auth</option>
          <option value="network">network</option>
        </select>
        <button type="button" className="nmx-log-viewer__refresh">
          {t("addon.log-viewer.refresh")}
        </button>
      </div>
      <div className="nmx-log-viewer__list">
        {MOCK_LOGS.map((entry, i) => (
          <div
            key={i}
            className={`nmx-log-viewer__entry nmx-log-viewer__entry--${entry.level}`}
          >
            <span className="nmx-log-viewer__time">{entry.time}</span>
            <span className="nmx-log-viewer__level">
              {entry.level.toUpperCase()}
            </span>
            <span className="nmx-log-viewer__source">{entry.source}</span>
            <span className="nmx-log-viewer__message">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
