import type { WithBaseProps } from "../../types"
import React, { useCallback, useMemo, useState } from "react"
import { cx } from "../../utils"
import { NmxRailContext, type NmxRailContextValue } from "./NmxRailContext"
import { isMobile } from "@namorix/core"

export interface NmxRailLayoutProps extends WithBaseProps {
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  collapseOnActiveClick?: boolean
}

export const NmxRail: React.FC<NmxRailLayoutProps> = ({
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  collapseOnActiveClick = true,
  shouldRender = true,
  className,
  children,
  ...rest
}) => {
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

  return (
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
}
