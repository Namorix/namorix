import type React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"

export type NmxFormSubmitEvent = React.SyntheticEvent<HTMLFormElement>

interface NmxFormProps extends WithBaseProps {
  onSubmit?: (e: NmxFormSubmitEvent) => void
}

export const NmxForm: React.FC<NmxFormProps> = ({
  onSubmit,
  shouldRender = true,
  children,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

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
