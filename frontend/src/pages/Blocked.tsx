import React from "react"
import { useTranslation } from "react-i18next"
import {
  type ApiErrorCode,
  HttpErrorCodes,
  MiddlewareErrorCodes,
} from "@namorix/core"
import {
  NmxButton,
  NmxCard,
  NmxCardHeader,
  NmxIconBox,
  NmxMetaItem,
  NmxMetaList,
} from "@namorix/ui"
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
      case HttpErrorCodes.CONNECTION_LOST:
        return {
          title: t("blocked.connectionLost.title"),
          description: t("blocked.connectionLost.description"),
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
        <NmxIconBox className="nmx-blocked-page__icon-box" semantic="error">
          <NmxIconFont
            symbol={NmxIconFontSymbol.SECURITY}
            className="nmx-blocked-page__icon-font"
          />
        </NmxIconBox>
        <NmxCardHeader
          title={title}
          description={description}
          titleClassName="nmx-blocked-page__header-title"
          descriptionClassName="nmx-blocked-page__header-description"
        />

        <NmxMetaList className="nmx-blocked-page__meta-list">
          <NmxMetaItem
            label={t("blocked.meta.label.status")}
            value={t("blocked.meta.value.blocked")}
            semantic="error"
          />
          <NmxMetaItem
            label={t("blocked.meta.label.timestamp")}
            value={new Date().toISOString()}
          />
        </NmxMetaList>
        {code === HttpErrorCodes.CONNECTION_LOST && (
          <NmxButton
            semantic="primary"
            label={t("blocked.refresh")}
            className="nmx-blocked-page__refresh-btn"
            fullWidth
            uppercase
            onClick={(e) => {
              e.stopPropagation()
              window.location.reload()
            }}
          />
        )}
      </NmxCard>
    </div>
  )
}
