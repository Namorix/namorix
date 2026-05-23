import type { WithBaseProps } from "../../types"
import { useCallback, useMemo, useState } from "react"
import { cx } from "../../utils"
import { NmxRailContext, type NmxRailContextValue } from "./NmxRailContext"
import { isMobile } from "@namorix/core"
import { NmxTabProvider } from "../NmxTabProvider"

export interface NmxRailLayoutProps<
  T extends string = string,
> extends WithBaseProps {
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  collapseOnActiveClick?: boolean
  defaultTab?: T
}

export const NmxRail = <T extends string = string>({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapseOnActiveClick = true,
  defaultTab,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxRailLayoutProps<T>) => {
  const isDeviceMobile = isMobile()
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const isCollapsed = isDeviceMobile ? true : (collapsed ?? internalCollapsed)
  const isCollapsedOnActive = isDeviceMobile ? true : collapseOnActiveClick

  const toggleCollapsed = useCallback(() => {
    const next = !isCollapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }, [isCollapsed, onCollapsedChange])

  const context = useMemo<NmxRailContextValue>(
    () => ({
      collapsed: isCollapsed,
      collapseOnActiveClick: isCollapsedOnActive,
      toggleCollapsed,
    }),
    [isCollapsedOnActive, isCollapsed, toggleCollapsed],
  )

  if (!shouldRender) {
    return null
  }

  const content = (
    <NmxRailContext.Provider value={context}>
      <div
        {...rest}
        className={cx(
          "nmx-rail",
          { "nmx-rail--collapsed": isCollapsed },
          { "nmx-rail--disable-collapsed": isDeviceMobile },
          className,
        )}
      >
        {children}
      </div>
    </NmxRailContext.Provider>
  )

  if (defaultTab !== undefined) {
    return <NmxTabProvider defaultTab={defaultTab}>{content}</NmxTabProvider>
  }

  return content
}
