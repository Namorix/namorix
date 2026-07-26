import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps, WithStylesheet } from "../../types"

interface NmxFormFieldProps extends WithBaseProps, WithStylesheet {
  label?: string
  controlId?: string
  helper?: string
  error?: string
  required?: boolean
  inline?: boolean
  rowFlex?: string | number
}

export const NmxFormField: React.FC<NmxFormFieldProps> = ({
  label,
  controlId,
  helper,
  error,
  required,
  inline = false,
  rowFlex,
  style,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return <></>
  }

  return (
    <div
      {...rest}
      className={cx(
        "nmx-form-field",
        { "nmx-form-field--inline": inline },
        className,
      )}
      style={{ ...style, ...(rowFlex !== undefined ? { flex: rowFlex } : {}) }}
    >
      {label && (
        <label className="nmx-form-field__label" htmlFor={controlId}>
          <span>{label}</span>
          {required && <span className="nmx-form-field--required">*</span>}
        </label>
      )}
      {children}
      {error && <p className="nmx-form-field__error-message">{error}</p>}
      {!error && helper && <p className="nmx-form-field__helper">{helper}</p>}
    </div>
  )
}
