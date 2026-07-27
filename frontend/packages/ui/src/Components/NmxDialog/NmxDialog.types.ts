import type { ReactNode } from "react"
import type { WithBaseProps } from "../../types"

export type NmxDialogSize = "sm" | "md" | "lg" | "full"

export interface NmxDialogProps extends WithBaseProps {
  open: boolean
  onClose?: () => void
  dismissable?: boolean
  size?: NmxDialogSize
  children: ReactNode
}

export interface NmxDialogHeaderProps extends WithBaseProps {
  title?: ReactNode
  icon?: ReactNode
  showCloseButton?: boolean
  onClose?: () => void
}

export interface NmxDialogBodyProps extends WithBaseProps {
  children: ReactNode
  html?: string
}

export interface NmxDialogFooterProps extends WithBaseProps {
  children: ReactNode
}
