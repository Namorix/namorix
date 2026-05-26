import React, { useEffect, useRef, useState } from "react"
import type { WithBaseProps } from "../types"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"

export interface NmxSelectMultipleData {
  value: string
  label: string
}

interface NmxSelectMultipleProps extends WithBaseProps {
  values: string[]
  options: NmxSelectMultipleData[]
  onChange?: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export const NmxSelectMultiple: React.FC<NmxSelectMultipleProps> = ({
  values = [],
  options,
  onChange,
  placeholder = "",
  disabled,
  className,
  shouldRender = true,
  ...rest
}) => {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const toggleOption = (val: string) => {
    const next = values.includes(val)
      ? values.filter((v) => v !== val)
      : [...values, val]
    onChange?.(next)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedCount = values.length
  const allCount = options.length

  if (!shouldRender) return

  return (
    <div
      {...rest}
      ref={wrapRef}
      className={cx("nmx-select-multiple", className)}
    >
      <button
        type="button"
        className={cx("nmx-select-multiple__trigger", {
          "nmx-select-multiple__trigger--open": open,
        })}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="nmx-select-multiple__label-wrap">
          <span className="nmx-select-multiple__label-insivible">
            Select ({allCount})
          </span>
          <span className="nmx-select-multiple__label">
            {selectedCount === 0
              ? placeholder
              : selectedCount === allCount
                ? `All (${allCount})`
                : `Select (${selectedCount})`}
          </span>
        </div>

        <span className="nmx-select-multiple__arrow" />
      </button>

      {open && (
        <div className="nmx-select-multiple__panel">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cx("nmx-select-multiple__option", {
                "nmx-select-multiple__option--selected": values.includes(
                  opt.value,
                ),
              })}
              onMouseDown={(e) => {
                e.preventDefault()
                toggleOption(opt.value)
              }}
            >
              <span className="nmx-select-multiple__check">
                {values.includes(opt.value) && (
                  <NmxIconFont
                    symbol={NmxIconFontSymbol.CHECK}
                    className="nmx-select-multiple__check-icon"
                  />
                )}
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
