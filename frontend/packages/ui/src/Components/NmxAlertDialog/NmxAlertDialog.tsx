import { NmxButton } from "../../Primitives"
import {
  NmxDialog,
  NmxDialogBody,
  NmxDialogFooter,
  NmxDialogHeader,
} from "../NmxDialog"
import type { NmxAlertDialogProps } from "./NmxAlertDialog.types"
import { useTranslation } from "react-i18next"

export const NmxAlertDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
}: NmxAlertDialogProps) => {
  const { t } = useTranslation()
  const confirm = confirmLabel ?? t("core:ui.alertDialog.confirm", "Confirm")
  const cancel = cancelLabel ?? t("core:ui.alertDialog.cancel", "Cancel")

  return (
    <NmxDialog
      open={open}
      onClose={loading ? undefined : onCancel}
      size="sm"
      dismissable={!loading}
    >
      <NmxDialogHeader title={title} onClose={loading ? undefined : onCancel} />
      <NmxDialogBody>{description}</NmxDialogBody>
      <NmxDialogFooter>
        <NmxButton
          variant="ghost"
          semantic="error"
          label={cancel}
          onClick={onCancel}
          disabled={loading}
          shouldRender={!!onCancel}
          className="nmx-dialog__button"
        />
        <NmxButton
          semantic="success"
          label={confirm}
          onClick={onConfirm}
          disabled={loading}
          className="nmx-dialog__button"
        />
      </NmxDialogFooter>
    </NmxDialog>
  )
}
