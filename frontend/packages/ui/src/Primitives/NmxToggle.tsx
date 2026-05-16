import React, { useId } from "react"
import { cx } from "@namorix/core/utils"

interface NmxToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string
  name?: string
  label?: string
  checked?: boolean
  disabled?: boolean
  shouldRender?: boolean
  onCheckedChanged?: (checked: boolean) => void
}

export const NmxToggle: React.FC<NmxToggleProps> = ({
  id,
  name,
  label,
  checked = false,
  disabled = false,
  shouldRender = true,
  className,
  onCheckedChanged,
  ...rest
}) => {
  const generatedId = useId()
  const resolvedId = id || generatedId

  if (!shouldRender) {
    return null
  }

  return (
    <div {...rest} className={cx("nmx-toggle", className)}>
      <input
        id={resolvedId}
        className="nmx-toggle-input"
        type="checkbox"
        name={name}
        defaultChecked={checked}
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
