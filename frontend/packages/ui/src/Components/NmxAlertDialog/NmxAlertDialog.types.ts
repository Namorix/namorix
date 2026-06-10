import type { ReactNode } from "react"
import type { WithBaseProps } from "../../types"
import type { NmxDialogSize } from "../NmxDialog"

export interface NmxAlertDialogProps extends WithBaseProps {
  open: boolean
  title?: string
  description?: string | ReactNode
  size?: NmxDialogSize
  confirmLabel?: string
  cancelLabel?: string
  closeLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
  loading?: boolean
}
