import React from "react"
import "./NmxForm.scss"
import { cx } from "@namorix/core/utils"

interface NmxFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  controlId?: string
  helper?: string
  error?: string
  required?: boolean
  shouldRender?: boolean
}

export const NmxFormField: React.FC<NmxFormFieldProps> = ({
  label,
  controlId,
  helper,
  error,
  required,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return <></>
  }

  return (
    <div {...rest} className={cx("nmx-form-field", className)}>
      {label && (
        <label className="nmx-form-field__label" htmlFor={controlId}>
          {label}
          {required && <span className="nmx-form-field--required">*</span>}
        </label>
      )}
      {children}
      {error && <p className="nmx-form-field__error-message">{error}</p>}
      {!error && helper && <p className="nmx-form-field__helper">{helper}</p>}
    </div>
  )
}
