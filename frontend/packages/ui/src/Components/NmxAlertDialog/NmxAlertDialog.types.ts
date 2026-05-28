import type { ReactNode } from "react"

export interface NmxAlertDialogProps {
  open: boolean
  title?: string
  description?: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  loading?: boolean
}
