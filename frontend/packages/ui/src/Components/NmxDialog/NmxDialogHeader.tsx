import { NmxIconFont, NmxIconFontSymbol } from "../../Primitives"
import type { NmxDialogHeaderProps } from "./NmxDialog.types"
import { cx } from "../../utils"

export const NmxDialogHeader = ({
  title,
  showCloseButton = true,
  onClose,
  className,
}: NmxDialogHeaderProps) => (
  <div className={cx("nmx-dialog__header", className)}>
    {title && <h2 className="nmx-dialog__title">{title}</h2>}
    {showCloseButton && (
      <button
        type="button"
        className="nmx-dialog__close"
        onClick={onClose}
        aria-label="Close"
      >
        <NmxIconFont symbol={NmxIconFontSymbol.CLOSE} />
      </button>
    )}
  </div>
)
