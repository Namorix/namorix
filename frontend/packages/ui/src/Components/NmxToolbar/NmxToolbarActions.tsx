import { useContext } from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import { NmxTabContext } from "../NmxTabContext"

export interface NmxToolbarActionsProps<
  T extends string = string,
> extends WithBaseProps {
  tabKeys?: T[]
}

export const NmxToolbarActions = <T extends string = string>({
  tabKeys,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxToolbarActionsProps<T>) => {
  const ctx = useContext(NmxTabContext)
  const visible =
    shouldRender && (!tabKeys?.length || tabKeys.includes(ctx?.activeTab as T))

  if (!visible) return null

  return (
    <div {...rest} className={cx("nmx-toolbar-actions", className)}>
      {children}
    </div>
  )
}
