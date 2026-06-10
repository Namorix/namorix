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
  size = "md",
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onCancel,
  onClose,
  loading = false,
  className,
  children,
}: NmxAlertDialogProps) => {
  const { t } = useTranslation()
  const confirm = confirmLabel ?? t("core:ui.alertDialog.confirm", "Confirm")
  const cancel =
    closeLabel ??
    (onClose ? t("core:ui.alertDialog.close", "Close") : null) ??
    cancelLabel ??
    t("core:ui.alertDialog.cancel", "Cancel")

  return (
    <NmxDialog
      open={open}
      onClose={loading ? undefined : (onClose ?? onCancel)}
      size={size}
      dismissable={!loading}
      className={className}
    >
      <NmxDialogHeader
        title={title}
        onClose={loading ? undefined : (onClose ?? onCancel)}
      />
      <NmxDialogBody>{children ?? description}</NmxDialogBody>
      <NmxDialogFooter>
        <NmxButton
          variant="ghost"
          semantic="error"
          label={cancel}
          onClick={onClose ?? onCancel}
          disabled={loading}
          className="nmx-dialog__button"
        />
        <NmxButton
          semantic="primary"
          label={confirm}
          onClick={onConfirm}
          disabled={loading}
          shouldRender={!!onConfirm}
          className="nmx-dialog__button"
        />
      </NmxDialogFooter>
    </NmxDialog>
  )
}
