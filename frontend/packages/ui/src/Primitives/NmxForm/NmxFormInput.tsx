import React from "react"
import { cx } from "@namorix/core/utils"

interface NmxFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string
  type?: string
  name?: string
  value?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  shouldRender?: boolean
  onValueChange?: (value: string) => void
}

export const NmxFormInput: React.FC<NmxFormInputProps> = ({
  id,
  type,
  name,
  value,
  placeholder,
  required = false,
  disabled = false,
  invalid = false,
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
      type={type}
      name={name}
      placeholder={placeholder}
      spellCheck={false}
      disabled={disabled}
      required={required}
      value={value}
      className={cx(
        "nmx-form-input",
        { "nmx-form-input--error": invalid },
        className,
      )}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  )
}
