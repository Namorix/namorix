import React from "react"
import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import { useNmxTabContext } from "../NmxTabContext"

export interface NmxToolbarContentProps<
  T extends string = string,
> extends WithBaseProps {
  tabKey?: T
}

export const NmxToolbarContent = <T extends string = string>({
  tabKey,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxToolbarContentProps<T>) => {
  if (!shouldRender) return null

  if (!tabKey) {
    return (
      <div {...rest} className={cx("nmx-toolbar-content", className)}>
        {children}
      </div>
    )
  }

  return (
    <NmxTabContentInner tabKey={tabKey} className={className}>
      {children}
    </NmxTabContentInner>
  )
}

const NmxTabContentInner: React.FC<{
  tabKey: string
  className?: string
  children: React.ReactNode
}> = ({ tabKey, className, children }) => {
  const ctx = useNmxTabContext()
  if (!ctx.isMounted(tabKey)) return null
  return (
    <div
      className={cx("nmx-toolbar-content", className)}
      style={ctx.activeTab !== tabKey ? { display: "none" } : undefined}
    >
      {children}
    </div>
  )
}
