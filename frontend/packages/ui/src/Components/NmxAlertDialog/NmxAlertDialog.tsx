import { NmxButton } from "../../Primitives"
import {
  NmxDialog,
  NmxDialogBody,
  NmxDialogFooter,
  NmxDialogHeader,
} from "../NmxDialog"
import type { NmxAlertDialogProps } from "./NmxAlertDialog.types"
import { useTranslation } from "react-i18next"
import { cx } from "../../utils"

export const NmxAlertDialog = ({
  open,
  title,
  icon,
  description,
  size = "md",
  confirmLabel,
  cancelLabel,
  closeLabel,
  onConfirm,
  onCancel,
  onClose,
  loading = false,
  noSpacingBody = false,
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
        icon={icon}
        onClose={loading ? undefined : (onClose ?? onCancel)}
      />
      <NmxDialogBody
        className={cx({ "nmx-dialog--no-spacing-body": noSpacingBody })}
      >
        {children ?? description}
      </NmxDialogBody>
      <NmxDialogFooter>
        <NmxButton
          variant="ghost"
          semantic="error"
          label={cancel}
          onClick={onClose ?? onCancel}
          disabled={loading}
          uppercase={true}
          className="nmx-dialog__button"
        />
        <NmxButton
          semantic="info"
          label={confirm}
          onClick={onConfirm}
          disabled={loading}
          shouldRender={!!onConfirm}
          uppercase={true}
          className="nmx-dialog__button"
        />
      </NmxDialogFooter>
    </NmxDialog>
  )
}
