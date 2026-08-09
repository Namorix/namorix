import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxSelect,
  type NmxSelectData,
  NmxTagInput,
  NmxToggle,
} from "@namorix/ui"
import type { WdFirewallRule, WdProtocol, WdRuleAction } from "./Warden.types"
import type { WdRulePayload } from "./warden.controller"

export interface WardenRuleDialogProps {
  open: boolean
  editing?: WdFirewallRule | null
  submitting?: boolean
  onClose: () => void
  onSubmit: (payload: WdRulePayload) => void
}

const Protocols: WdProtocol[] = ["any", "tcp", "udp", "icmp"]
const Actions: WdRuleAction[] = ["allow", "deny"]

export const WardenRuleDialog: React.FC<WardenRuleDialogProps> = ({
  open,
  editing,
  submitting,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation()

  const [name, setName] = useState("")
  const [sourceCidr, setSourceCidr] = useState("")
  const [portsTags, setPortsTags] = useState<string[]>([])
  const [protocol, setProtocol] = useState<WdProtocol>("any")
  const [action, setAction] = useState<WdRuleAction>("allow")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      setName(editing?.name ?? "")
      setSourceCidr(editing?.sourceCidr ?? "")
      setPortsTags(
        (editing?.ports ?? "")
          .split(",")
          .filter(Boolean)
          .map((s) => s.trim()),
      )
      setProtocol(editing?.protocol ?? "any")
      setAction(editing?.action ?? "allow")
      setEnabled(editing?.enabled ?? true)
    }, 0)
    return () => clearTimeout(timeout)
  }, [open, editing])

  const protocolOptions: NmxSelectData<WdProtocol>[] = Protocols.map((p) => ({
    value: p,
    label: t(`addon.warden.pages.rules.protocol.${p}`),
  }))
  const actionOptions: NmxSelectData<WdRuleAction>[] = Actions.map((a) => ({
    value: a,
    label: t(`addon.warden.pages.rules.action.${a}`),
  }))

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      sourceCidr: sourceCidr.trim() || null,
      ports: portsTags.length > 0 ? portsTags.join(",") : null,
      protocol,
      action,
      enabled,
    })
  }

  return (
    <NmxAlertDialog
      open={open}
      title={t(
        editing
          ? "addon.warden.pages.rules.dialog.titleEdit"
          : "addon.warden.pages.rules.dialog.titleAdd",
      )}
      onClose={onClose}
      size="lg"
      onConfirm={handleSubmit}
      loading={submitting}
      confirmLabel={t("addon.warden.pages.rules.dialog.save")}
      confirmDisabled={!name.trim()}
    >
      <NmxForm>
        <NmxFormField
          label={t("addon.warden.pages.rules.dialog.name")}
          required
        >
          <NmxFormInput
            value={name}
            onValueChange={setName}
            placeholder={t("addon.warden.pages.rules.dialog.namePlaceholder")}
          />
        </NmxFormField>
        <NmxFormField
          label={t("addon.warden.pages.rules.dialog.sourceCidr")}
          helper={t("addon.warden.pages.rules.dialog.sourceCidrHint")}
        >
          <NmxFormInput
            value={sourceCidr}
            onValueChange={setSourceCidr}
            placeholder="0.0.0.0/0"
          />
        </NmxFormField>
        <NmxFormField
          label={t("addon.warden.pages.rules.dialog.ports")}
          helper={t("addon.warden.pages.rules.dialog.portsHint")}
        >
          <NmxTagInput
            value={portsTags}
            onChange={setPortsTags}
            placeholder="80,443"
          />
        </NmxFormField>
        <NmxFormField label={t("addon.warden.pages.rules.dialog.protocol")}>
          <NmxSelect
            value={protocol}
            options={protocolOptions}
            onChange={setProtocol}
          />
        </NmxFormField>
        <NmxFormField label={t("addon.warden.pages.rules.dialog.action")}>
          <NmxSelect
            value={action}
            options={actionOptions}
            onChange={setAction}
          />
        </NmxFormField>
        <NmxFormField
          label={t("addon.warden.pages.rules.dialog.enabled")}
          inline={true}
        >
          <NmxToggle checked={enabled} onCheckedChanged={setEnabled} />
        </NmxFormField>
      </NmxForm>
    </NmxAlertDialog>
  )
}
