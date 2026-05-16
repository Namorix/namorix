import React from "react"
import { useTranslation } from "react-i18next"
import {
  type ApiErrorCode,
  HttpErrorCodes,
  MiddlewareErrorCodes,
} from "@namorix/core"
import "./Blocked.scss"
import { NmxCard, NmxCardHeader, NmxIconBox } from "@namorix/ui"
import { NmxIconFont, NmxIconFontSymbol } from "@namorix/ui"

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
        <NmxIconBox>
          <NmxIconFont symbol={NmxIconFontSymbol.SECURITY} />
        </NmxIconBox>
        <NmxCardHeader title={title} description={description} />

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
