import { cx } from "../../utils"
import type { NmxDialogFooterProps } from "./NmxDialog.types"

export const NmxDialogFooter = ({
  children,
  className,
  ...rest
}: NmxDialogFooterProps) => (
  <div {...rest} className={cx("nmx-dialog__footer", className)}>
    {children}
  </div>
)
