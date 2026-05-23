import type { WithBaseProps } from "../types"
import React from "react"
import { cx } from "../utils"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"
import { NmxFormInput } from "./NmxForm"

interface NmxSearchInputProps extends WithBaseProps {
  ref?: React.RefObject<HTMLInputElement | null>
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
}

export const NmxSearchInput = ({
  ref,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  shouldRender = true,
  className,
}: NmxSearchInputProps) => {
  if (!shouldRender) return null

  return (
    <div className={cx("nmx-search-input", className)}>
      <NmxIconFont
        symbol={NmxIconFontSymbol.SEARCH}
        className="nmx-search-input__icon"
      />
      <NmxFormInput
        ref={ref}
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        invalid={invalid}
        className="nmx-search-input__control"
      />
      {value && (
        <button
          type="button"
          className="nmx-search-input__clear"
          onClick={() => onChange?.("")}
        >
          <NmxIconFont symbol={NmxIconFontSymbol.CLOSE} />
        </button>
      )}
    </div>
  )
}
