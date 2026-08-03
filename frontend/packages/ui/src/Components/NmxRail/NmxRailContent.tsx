import type { WithBaseProps } from "../../types"
import React from "react"
import { cx } from "../../utils"
import { useNmxTabContext } from "../NmxTabContext"

export interface NmxRailContentProps<
  T extends string = string,
> extends WithBaseProps {
  tabKey?: T
  spacingHorizontalDisabled?: boolean
  spacingVerticalDisabled?: boolean
}

export const NmxRailContent = <T extends string = string>({
  tabKey,
  spacingHorizontalDisabled = false,
  spacingVerticalDisabled = false,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxRailContentProps<T>) => {
  if (!shouldRender) return null

  if (!tabKey) {
    return (
      <div
        {...rest}
        className={cx(
          "nmx-rail-content",
          {
            "nmx-rail-content--spacing-horizontal-disabled":
              spacingHorizontalDisabled,
            "nmx-rail-content--spacing-vertical-disabled":
              spacingVerticalDisabled,
          },
          className,
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <NmxRailTabContentInner
      tabKey={tabKey}
      className={className}
      spacingHorizontalDisabled={spacingHorizontalDisabled}
      spacingVerticalDisabled={spacingVerticalDisabled}
    >
      {children}
    </NmxRailTabContentInner>
  )
}

const NmxRailTabContentInner: React.FC<{
  tabKey: string
  className?: string
  children: React.ReactNode
  spacingHorizontalDisabled?: boolean
  spacingVerticalDisabled?: boolean
}> = ({
  tabKey,
  className,
  children,
  spacingHorizontalDisabled = false,
  spacingVerticalDisabled = false,
}) => {
  const ctx = useNmxTabContext()
  if (!ctx.isMounted(tabKey)) return null
  return (
    <div
      className={cx(
        "nmx-rail-content",
        {
          "nmx-rail-content--spacing-horizontal-disabled":
            spacingHorizontalDisabled,
          "nmx-rail-content--spacing-vertical-disabled":
            spacingVerticalDisabled,
        },
        className,
      )}
      style={ctx.activeTab !== tabKey ? { display: "none" } : undefined}
    >
      {children}
    </div>
  )
}
