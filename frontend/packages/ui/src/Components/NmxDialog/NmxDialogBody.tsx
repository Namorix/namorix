import { cx } from "../../utils"
import type { NmxDialogBodyProps } from "./NmxDialog.types"

export const NmxDialogBody = ({
  html,
  children,
  className,
  ...rest
}: NmxDialogBodyProps) => (
  <>
    {typeof html !== "undefined" ? (
      <div
        {...rest}
        className={cx("nmx-dialog__body", className)}
        dangerouslySetInnerHTML={{ __html: html ?? "" }}
      ></div>
    ) : (
      <div {...rest} className={cx("nmx-dialog__body", className)}>
        {children}
      </div>
    )}
  </>
)
