import { createPortal } from "react-dom"
import { cx } from "../../utils"
import type { NmxDialogProps } from "./NmxDialog.types"

export const NmxDialog = ({
  open,
  onClose,
  dismissable = true,
  size = "md",
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxDialogProps) => {
  if (!shouldRender || !open) return null

  return createPortal(
    <div
      {...rest}
      className={cx(
        "nmx-dialog",
        { "nmx-dialog--full": size === "full" },
        className,
      )}
    >
      <div
        className="nmx-dialog__overlay"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        className={cx("nmx-dialog__panel", `nmx-dialog__panel--${size}`)}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
