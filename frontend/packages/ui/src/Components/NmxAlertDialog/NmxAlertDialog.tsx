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
import { markupToHtmlFromNode } from "@namorix/core"

export const NmxAlertDialog = ({
  open,
  title,
  icon,
  description,
  size = "md",
  confirmLabel,
  confirmDisabled = false,
  confirmShouldRender = true,
  confirmSemantic = "primary",
  cancelLabel,
  closeLabel,
  extraActionLabel,
  extraActionDisabled = false,
  onConfirm,
  onCancel,
  onClose,
  onExtraAction,
  loading = false,
  noSpacingBody = false,
  noBodyScrollbar = false,
  markupToHtmlEnabled = false,
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
        className={cx({
          "nmx-dialog--no-spacing-body": noSpacingBody,
          "nmx-dialog--no-scrollbar-body": noBodyScrollbar,
        })}
        html={
          markupToHtmlEnabled
            ? markupToHtmlFromNode(description ?? children)
            : undefined
        }
      >
        {markupToHtmlEnabled ? null : (children ?? description)}
      </NmxDialogBody>
      <NmxDialogFooter>
        {extraActionLabel && (
          <div className="nmx-dialog__footer-actions">
            <NmxButton
              variant="ghost"
              semantic="success"
              label={extraActionLabel}
              onClick={onExtraAction}
              disabled={loading || extraActionDisabled}
              uppercase={true}
              className="nmx-dialog__button nmx-dialog__button-extra"
            />
          </div>
        )}
        <div className="nmx-dialog__footer-buttons">
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
            semantic={confirmSemantic}
            label={confirm}
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            shouldRender={!!onConfirm && confirmShouldRender}
            uppercase={true}
            className="nmx-dialog__button"
          />
        </div>
      </NmxDialogFooter>
    </NmxDialog>
  )
}
