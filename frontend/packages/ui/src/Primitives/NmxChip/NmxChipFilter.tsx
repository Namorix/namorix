import type { NmxSpacing, WithBaseProps, WithSemanticColor } from "../../types"
import React from "react"
import { cx, cxSemantic, cxSpacing } from "../../utils"
import { NmxIconFont, NmxIconFontSymbol } from "../NmxIcon"

interface NmxChipFilterProps extends WithBaseProps, WithSemanticColor {
  active?: boolean
  size?: NmxSpacing
  onClick?: () => void
}

export const NmxChipFilter: React.FC<NmxChipFilterProps> = ({
  active = false,
  size = "md",
  semantic = "info",
  shouldRender = true,
  onClick,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <span
      {...rest}
      role="checkbox"
      aria-checked={active}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.()
      }}
      className={cx(
        "nmx-chip",
        "nmx-chip--filter",
        { "nmx-chip--active": active },
        cxSemantic("nmx-chip", semantic),
        cxSpacing("nmx-chip", size),
        className,
      )}
    >
      <NmxIconFont
        className="nmx-chip-filter__check"
        symbol={NmxIconFontSymbol.CHECK}
        aria-hidden="true"
      />
      {children}
    </span>
  )
}
