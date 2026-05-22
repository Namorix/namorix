import React, { useId } from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"

interface NmxToggleProps extends WithBaseProps {
  id?: string
  name?: string
  label?: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChanged?: (checked: boolean) => void
}

export const NmxToggle: React.FC<NmxToggleProps> = ({
  id,
  name,
  label,
  checked,
  disabled = false,
  defaultChecked = false,
  shouldRender = true,
  onCheckedChanged,
  className,
  ...rest
}) => {
  const generatedId = useId()
  const resolvedId = id || generatedId

  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-toggle", className)}>
      <input
        id={resolvedId}
        className="nmx-toggle-input"
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={checked !== undefined ? undefined : defaultChecked}
        disabled={disabled}
        onChange={(e) => onCheckedChanged?.(e.target.checked)}
      />
      <label className="nmx-toggle-track" htmlFor={resolvedId} />
      {label && (
        <label className="nmx-toggle-label" htmlFor={resolvedId}>
          {label}
        </label>
      )}
    </div>
  )
}
