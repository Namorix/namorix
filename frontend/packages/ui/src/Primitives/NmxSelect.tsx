import React from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"

export interface NmxSelectData {
  value: string
  label: string
}

interface NmxSelectProps extends WithBaseProps {
  value?: string
  defaultValue?: string
  options: NmxSelectData[]
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
  ...rest
}) => {
  if (shouldRender === false) {
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value)
  }

  return (
    <div className="nmx-select-wrap">
      <select
        {...rest}
        className={cx("nmx-select-control", className)}
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
    </div>
  )
}
