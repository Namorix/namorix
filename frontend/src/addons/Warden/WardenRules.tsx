import React from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlign,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxFallback,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMenuButton,
} from "@namorix/ui"
import type { WdFirewallRule } from "./Warden.types"

export interface WardenRulesProps {
  rules: WdFirewallRule[]
  loading?: boolean
  onAdd: () => void
  onEdit: (rule: WdFirewallRule) => void
  onDelete: (rule: WdFirewallRule) => void
  onToggle: (rule: WdFirewallRule) => void
}

export const WardenRules: React.FC<WardenRulesProps> = ({
  rules,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const { t } = useTranslation()

  const columns: NmxDataTableColumn<WdFirewallRule>[] = [
    {
      header: t("addon.warden.rules.columns.name"),
      renderCell: (row) => row.name,
      grow: 2,
    },
    {
      header: t("addon.warden.rules.columns.source"),
      renderCell: (row) => row.sourceCidr ?? t("addon.warden.rules.sourceAny"),
      grow: 2,
    },
    {
      header: t("addon.warden.rules.columns.ports"),
      renderCell: (row) =>
        row.ports
          ? `${row.ports} / ${row.protocol.toUpperCase()}`
          : row.protocol.toUpperCase(),
      grow: 1,
      disableEllipsisCell: true,
    },
    {
      header: t("addon.warden.rules.columns.action"),
      renderCell: (row) => (
        <NmxBadge
          semantic={row.action === "allow" ? "success" : "error"}
          size="sm"
        >
          {t(`addon.warden.rules.action.${row.action}`)}
        </NmxBadge>
      ),
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: "",
      renderCell: (row) => (
        <NmxMenuButton
          variant="ghost"
          arrowDisabled
          options={[
            {
              value: "toggle",
              label: t(
                row.enabled
                  ? "addon.warden.rules.menu.disable"
                  : "addon.warden.rules.menu.enable",
              ),
              semantic: row.enabled ? "warning" : "success",
              icon: row.enabled
                ? NmxIconFontSymbol.PAUSE
                : NmxIconFontSymbol.PLAY,
            },
            {
              value: "edit",
              label: t("addon.warden.rules.menu.edit"),
              icon: NmxIconFontSymbol.EDIT,
            },
            {
              value: "delete",
              label: t("addon.warden.rules.menu.delete"),
              semantic: "error",
              icon: NmxIconFontSymbol.DELETE,
            },
          ]}
          dividerIndexes={[{ value: "delete", position: "top" }]}
          onSelect={(action) => {
            if (action === "toggle") onToggle(row)
            else if (action === "edit") onEdit(row)
            else onDelete(row)
          }}
        >
          <NmxIconFont symbol={NmxIconFontSymbol.MENU_VERTICAL} />
        </NmxMenuButton>
      ),
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      btnIsMenu: true,
    },
  ]

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.warden.rules.fallbacks.loading"),
    },
    {
      state: "empty",
      condition: rules.length === 0,
      content: t("addon.warden.rules.fallbacks.empty"),
    },
  ]

  return (
    <>
      <NmxAlign direction="row" justify="between">
        <h3>{t("addon.warden.rules.title")}</h3>
        <NmxButton semantic="success" onClick={onAdd}>
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>{t("addon.warden.rules.add")}</span>
        </NmxButton>
      </NmxAlign>
      <NmxDataTable
        columns={columns}
        rows={rules}
        fallbackConditions={fallbackConditions}
        className="nmx-addon-page__data-table"
      />
    </>
  )
}
