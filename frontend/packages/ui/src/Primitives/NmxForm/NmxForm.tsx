import type React from "react"
import { cx } from "@namorix/core/utils"

export type NmxFormSubmitEvent = React.SyntheticEvent<HTMLFormElement>

interface NmxFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: NmxFormSubmitEvent) => void
}

export const NmxForm: React.FC<NmxFormProps> = ({
  children,
  onSubmit,
  className,
  ...rest
}) => {
  const handleSubmit = (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    onSubmit?.(e)
  }
  return (
    <form
      noValidate
      {...rest}
      className={cx("nmx-form", className)}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  )
}
