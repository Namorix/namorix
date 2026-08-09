import type { NmxSpacing, WithBaseProps, WithSemanticColor } from "../../types"
import React, { useState } from "react"
import { cx, cxSemantic, cxSpacing } from "../../utils"

interface NmxChipToggleProps extends WithBaseProps, WithSemanticColor {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  size?: NmxSpacing
  onCheckedChanged?: (checked: boolean) => void
}

export const NmxChipToggle: React.FC<NmxChipToggleProps> = ({
  checked,
  defaultChecked = false,
  disabled = false,
  size = "md",
  semantic = "info",
  shouldRender = true,
  onCheckedChanged,
  children,
  className,
  ...rest
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const isChecked = checked !== undefined ? checked : internalChecked

  if (!shouldRender) return null

  const handleToggle = () => {
    if (disabled) return
    const next = !isChecked
    if (checked === undefined) setInternalChecked(next)
    onCheckedChanged?.(next)
  }

  return (
    <span
      {...rest}
      role="switch"
      aria-checked={isChecked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleToggle()
        }
      }}
      className={cx(
        "nmx-chip",
        "nmx-chip--toggle",
        { "nmx-chip--active": isChecked },
        cxSemantic("nmx-chip", semantic),
        cxSpacing("nmx-chip", size),
        className,
      )}
    >
      {children}
    </span>
  )
}
