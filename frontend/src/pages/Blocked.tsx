import React from "react"
import { useTranslation } from "react-i18next"
import {
  type ApiErrorCode,
  HttpErrorCodes,
  MiddlewareErrorCodes,
} from "@namorix/core"
import "./Blocked.scss"
import { NmxCard } from "@namorix/ui"

interface BlockedProps {
  code: ApiErrorCode | null
}

export const Blocked: React.FC<BlockedProps> = ({ code }) => {
  const { t } = useTranslation()

  const getContent = () => {
    switch (code) {
      case HttpErrorCodes.INTERNAL_ERROR:
        return {
          title: t("blocked.internalError.title"),
          description: t("blocked.internalError.description"),
        }
      case MiddlewareErrorCodes.UNTRUSTED_PROXY:
        return {
          title: t("blocked.untrusted.title"),
          description: t("blocked.untrusted.description"),
        }
      case HttpErrorCodes.NOT_FOUND:
        return {
          title: t("blocked.notFound.title"),
          description: t("blocked.notFound.description"),
        }
      default:
        return {
          title: t("blocked.unknown.title"),
          description: t("blocked.unknown.description"),
        }
    }
  }

  const { title, description } = getContent()

  return (
    <div className="nmx-blocked-page">
      <NmxCard className="nmx-blocked-page__card">
        <div className="nmx-blocked-page__icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3z" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>

        <h1 className="nmx-blocked-page__title">{title}</h1>
        <p className="nmx-blocked-page__desc">{description}</p>

        <div className="nmx-blocked-page__meta">
          <div className="nmx-blocked-page__meta-row">
            <span className="nmx-blocked-page__meta-label">
              {t("blocked.meta.label.status")}
            </span>
            <span className="nmx-blocked-page__meta-value nmx-blocked-page__meta-value--danger">
              {t("blocked.meta.value.blocked")}
            </span>
          </div>
          <div className="nmx-blocked-page__meta-row">
            <span className="nmx-blocked-page__meta-label">
              {t("blocked.meta.label.timestamp")}
            </span>
            <span className="nmx-blocked-page__meta-value">
              {new Date().toISOString()}
            </span>
          </div>
        </div>
      </NmxCard>
    </div>
  )
}
