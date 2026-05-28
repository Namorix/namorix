import { NmxButton } from "../../Primitives"
import {
  NmxDialog,
  NmxDialogBody,
  NmxDialogFooter,
  NmxDialogHeader,
} from "../NmxDialog"
import type { NmxAlertDialogProps } from "./NmxAlertDialog.types"

export const NmxAlertDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}: NmxAlertDialogProps) => (
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
        semantic="error"
        label={cancelLabel}
        onClick={onCancel}
        disabled={loading}
        shouldRender={!!onCancel}
      />
      <NmxButton
        semantic="success"
        label={confirmLabel}
        onClick={onConfirm}
        disabled={loading}
      />
    </NmxDialogFooter>
  </NmxDialog>
)
