import React from "react"
import { NmxIconFont, type NmxIconFontSymbol } from "../Primitives"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

interface NmxSectionProps extends WithBaseProps {
  label: string
  icon?: NmxIconFontSymbol
}

export const NmxSection: React.FC<NmxSectionProps> = ({
  label,
  icon,
  children,
  className,
}) => (
  <section className={cx("nmx-section", className)}>
    <span className="nmx-section__label">
      {icon && <NmxIconFont symbol={icon} className="nmx-section__icon" />}
      {label}
    </span>
    {children}
  </section>
)
