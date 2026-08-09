import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxSelect,
  type NmxSelectData,
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

const PROTOCOLS: WdProtocol[] = ["any", "tcp", "udp", "icmp"]
const ACTIONS: WdRuleAction[] = ["allow", "deny"]

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
  const [ports, setPorts] = useState("")
  const [protocol, setProtocol] = useState<WdProtocol>("any")
  const [action, setAction] = useState<WdRuleAction>("allow")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      setName(editing?.name ?? "")
      setSourceCidr(editing?.sourceCidr ?? "")
      setPorts(editing?.ports ?? "")
      setProtocol(editing?.protocol ?? "any")
      setAction(editing?.action ?? "allow")
      setEnabled(editing?.enabled ?? true)
    }, 0)
    return () => clearTimeout(timeout)
  }, [open, editing])

  const protocolOptions: NmxSelectData<WdProtocol>[] = PROTOCOLS.map((p) => ({
    value: p,
    label: t(`addon.warden.protocol.${p}`),
  }))
  const actionOptions: NmxSelectData<WdRuleAction>[] = ACTIONS.map((a) => ({
    value: a,
    label: t(`addon.warden.rules.action.${a}`),
  }))

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      sourceCidr: sourceCidr.trim() || null,
      ports: ports.trim() || null,
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
          ? "addon.warden.dialog.titleEdit"
          : "addon.warden.dialog.titleAdd",
      )}
      onClose={onClose}
      size="lg"
      onConfirm={handleSubmit}
      loading={submitting}
      confirmLabel={t("addon.warden.dialog.save")}
      confirmDisabled={!name.trim()}
    >
      <NmxForm>
        <NmxFormField label={t("addon.warden.dialog.name")} required>
          <NmxFormInput
            value={name}
            onValueChange={setName}
            placeholder={t("addon.warden.dialog.namePlaceholder")}
          />
        </NmxFormField>
        <NmxFormField
          label={t("addon.warden.dialog.sourceCidr")}
          helper={t("addon.warden.dialog.sourceCidrHint")}
        >
          <NmxFormInput
            value={sourceCidr}
            onValueChange={setSourceCidr}
            placeholder="0.0.0.0/0"
          />
        </NmxFormField>
        <NmxFormField
          label={t("addon.warden.dialog.ports")}
          helper={t("addon.warden.dialog.portsHint")}
        >
          <NmxFormInput
            value={ports}
            onValueChange={setPorts}
            placeholder="80,443"
          />
        </NmxFormField>
        <NmxFormField label={t("addon.warden.dialog.protocol")}>
          <NmxSelect
            value={protocol}
            options={protocolOptions}
            onChange={setProtocol}
          />
        </NmxFormField>
        <NmxFormField label={t("addon.warden.dialog.action")}>
          <NmxSelect
            value={action}
            options={actionOptions}
            onChange={setAction}
          />
        </NmxFormField>
        <NmxFormField label={t("addon.warden.dialog.enabled")}>
          <NmxToggle checked={enabled} onCheckedChanged={setEnabled} />
        </NmxFormField>
      </NmxForm>
    </NmxAlertDialog>
  )
}
