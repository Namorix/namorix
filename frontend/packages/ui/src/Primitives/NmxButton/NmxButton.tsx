import React from "react"
import type { WithBaseProps, WithVariant, WithSemanticColor } from "../../types"
import { cx, cxSemantic, cxVariant } from "../../utils"

interface NmxButtonProps extends WithBaseProps, WithVariant, WithSemanticColor {
  type?: "button" | "submit" | "reset"
  label?: string
  title?: string
  disabled?: boolean
  fullWidth?: boolean
  uppercase?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export const NmxButton: React.FC<NmxButtonProps> = ({
  variant = "filled",
  semantic = "primary",
  type = "button",
  label,
  title,
  disabled = false,
  fullWidth = false,
  uppercase = false,
  onClick,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <button
      {...rest}
      type={type}
      title={title}
      disabled={disabled}
      className={cx(
        "nmx-button",
        { "nmx-button--full-width": fullWidth },
        { "nmx-button--upper-case": uppercase },
        cxVariant("nmx-button", variant),
        cxSemantic("nmx-button", semantic),
        className,
      )}
      onClick={onClick}
    >
      {children ?? label}
    </button>
  )
}
