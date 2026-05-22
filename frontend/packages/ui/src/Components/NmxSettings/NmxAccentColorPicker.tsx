import React from "react"
import { type WithBaseProps } from "../../types"
import { cx } from "../../utils"

export interface NmxAccentColorData {
  id: string
  color: string
}

interface NmxAccentColorPickerProps extends WithBaseProps {
  colors: NmxAccentColorData[]
  value: string
  onChange: (id: string) => void
}

export const NmxAccentColorPicker: React.FC<NmxAccentColorPickerProps> = ({
  colors,
  value,
  onChange,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) return null

  return (
    <div {...rest} className={cx("nmx-accent-picker", className)}>
      {colors.map((c) => (
        <div
          key={c.id}
          className={cx("nmx-accent-picker__dot", {
            "nmx-accent-picker__dot--active": value === c.id,
          })}
          style={{ background: c.color }}
          onClick={() => onChange(c.id)}
        />
      ))}
    </div>
  )
}
