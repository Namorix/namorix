import type { ReactNode } from "react"
import type { NmxSemanticColor, WithBaseProps } from "../../types"
import type { NmxDialogSize } from "../NmxDialog"

export interface NmxAlertDialogProps extends WithBaseProps {
  open: boolean
  title?: string
  icon?: ReactNode
  description?: string | ReactNode
  size?: NmxDialogSize
  confirmLabel?: string
  confirmDisabled?: boolean
  confirmShouldRender?: boolean
  confirmSemantic?: NmxSemanticColor
  cancelLabel?: string
  closeLabel?: string
  extraActionLabel?: string
  extraActionDisabled?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
  onExtraAction?: () => void
  loading?: boolean
  noSpacingBody?: boolean
  noBodyScrollbar?: boolean
  markupToHtmlEnabled?: boolean
}
