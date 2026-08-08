import React from "react"
import { cx, cxSemantic } from "../../utils"
import type {
  NmxSemanticColor,
  WithBaseProps,
  WithStylesheet,
} from "../../types"

interface NmxFormFieldProps extends WithBaseProps, WithStylesheet {
  label?: string
  controlId?: string
  helper?: string
  helperSemantic?: NmxSemanticColor
  error?: string
  required?: boolean
  inline?: boolean
  rowFlex?: string | number
}

export const NmxFormField: React.FC<NmxFormFieldProps> = ({
  label,
  controlId,
  helper,
  helperSemantic = null,
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
      {!error && helper && (
        <p
          className={cx(
            "nmx-form-field__helper",
            cxSemantic("nmx-form-field__helper", helperSemantic),
          )}
        >
          {helper}
        </p>
      )}
    </div>
  )
}
