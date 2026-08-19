import React from "react"
import { NmxIconFont, NmxIconFontSymbol } from "../NmxIcon"
import { NmxButton } from "./NmxButton"
import type { WithBaseProps, WithSemanticColor, WithVariant } from "../../types"
import { cx } from "@namorix/ui"

export interface NmxButtonActionBaseProps {
  title?: string | null
  tooltip?: string
  onClick?: (e: React.MouseEvent) => void
}

interface NmxButtonActionProps
  extends
    NmxButtonActionBaseProps,
    WithBaseProps,
    WithSemanticColor,
    WithVariant {
  icon: NmxIconFontSymbol
}

export const NmxButtonAction: React.FC<NmxButtonActionProps> = ({
  title = null,
  tooltip,
  icon,
  semantic = "primary",
  variant = "ghost",
  onClick,
  className,
  shouldRender = true,
}) => {
  if (!shouldRender) return

  return (
    <NmxButton
      title={title ?? ""}
      onClick={onClick}
      tooltip={tooltip}
      className={cx(
        {
          "nmx-button__action--has-title": typeof title !== undefined,
        },
        className,
      )}
      semantic={semantic}
      variant={title ? "filled" : variant}
    >
      <NmxIconFont symbol={icon} />
      {title && <span className="nmx-button__action-title">{title}</span>}
    </NmxButton>
  )
}
