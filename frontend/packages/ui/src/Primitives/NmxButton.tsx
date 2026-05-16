import React from "react"
import { cx } from "@namorix/core/utils"

type NmxButtonVariant = "primary" | "ghost"

interface NmxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NmxButtonVariant
  type?: "button" | "submit" | "reset"
  label?: string
  disabled?: boolean
  fullWidth?: boolean
  uppercase?: boolean
  shouldRender?: boolean
}

export const NmxButton: React.FC<NmxButtonProps> = ({
  variant = "primary",
  type = "button",
  label,
  disabled = false,
  fullWidth = false,
  uppercase = false,
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
      disabled={disabled}
      className={cx(
        "nmx-button",
        "nmx-button--" + variant,
        { "nmx-button--full-width": fullWidth },
        { "nmx-button--upper-case": uppercase },
        className,
      )}
    >
      {children ?? label}
    </button>
  )
}
