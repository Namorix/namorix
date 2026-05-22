import React from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

interface NmxSelectProps extends WithBaseProps {
  value?: string
  defaultValue?: string
  options: { value: string; label: string }[]
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export const NmxSelect: React.FC<NmxSelectProps> = ({
  value,
  defaultValue,
  options,
  onChange,
  placeholder,
  disabled,
  className,
  shouldRender,
}) => {
  if (shouldRender === false) return null

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <select
      className={cx("nmx-select", className)}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      disabled={disabled}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
