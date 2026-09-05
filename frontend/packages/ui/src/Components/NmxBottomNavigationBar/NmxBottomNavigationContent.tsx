import React from "react"
import { cx } from "../../utils"
import type { WithBaseProps } from "../../types"
import { useNmxTabContext } from "../NmxTabContext"

export interface NmxBottomNavigationContentProps<
  T extends string = string,
> extends WithBaseProps {
  tabKey?: T
  spacingHorizontalDisabled?: boolean
  spacingVerticalDisabled?: boolean
}

export const NmxBottomNavigationContent = <T extends string = string>({
  tabKey,
  spacingHorizontalDisabled = false,
  spacingVerticalDisabled = false,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxBottomNavigationContentProps<T>) => {
  if (!shouldRender) return null

  const classes = cx(
    "nmx-bottom-nav-content",
    {
      "nmx-bottom-nav-content--spacing-horizontal-disabled":
        spacingHorizontalDisabled,
      "nmx-bottom-nav-content--spacing-vertical-disabled":
        spacingVerticalDisabled,
    },
    className,
  )

  if (!tabKey) {
    return (
      <div {...rest} className={classes}>
        {children}
      </div>
    )
  }

  return (
    <NmxBottomNavTabContentInner tabKey={tabKey} className={classes}>
      {children}
    </NmxBottomNavTabContentInner>
  )
}

const NmxBottomNavTabContentInner: React.FC<{
  tabKey: string
  className?: string
  children: React.ReactNode
}> = ({ tabKey, className, children }) => {
  const ctx = useNmxTabContext()
  if (!ctx.isMounted(tabKey)) return null
  return (
    <div
      className={className}
      style={ctx.activeTab !== tabKey ? { display: "none" } : undefined}
    >
      {children}
    </div>
  )
}
