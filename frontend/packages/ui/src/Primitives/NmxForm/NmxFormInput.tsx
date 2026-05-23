import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

interface NmxFormInputProps extends WithBaseProps {
  id?: string
  ref?: React.RefObject<HTMLInputElement | null>
  type?: string
  name?: string
  value?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  autoComplete?: string
  onValueChange?: (value: string) => void
}

export const NmxFormInput: React.FC<NmxFormInputProps> = ({
  id,
  ref,
  type,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  invalid = false,
  autoComplete = "off",
  shouldRender = true,
  onValueChange,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return null
  }

  return (
    <input
      {...rest}
      id={id}
      ref={ref}
      type={type}
      name={name}
      placeholder={placeholder}
      spellCheck={false}
      disabled={disabled}
      required={required}
      value={value}
      autoComplete={autoComplete}
      className={cx(
        "nmx-form-input",
        { "nmx-form-input--error": invalid },
        className,
      )}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  )
}
