import { cx } from "../../utils"
import type { NmxDialogBodyProps } from "./NmxDialog.types"

export const NmxDialogBody = ({
  children,
  className,
  ...rest
}: NmxDialogBodyProps) => (
  <div {...rest} className={cx("nmx-dialog__body", className)}>
    {children}
  </div>
)
