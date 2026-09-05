import type { WithBaseProps } from "../../types"
import type { NmxIconFontSymbol } from "../../Primitives"
import type { TFunction } from "@namorix/core"

export interface NmxBottomNavigationBarProps extends WithBaseProps {
  items?: NmxBottomNavigationBarItemData[]
  activeKey?: string
  onActiveTabChange?: (key: string) => void
  t?: TFunction
}

export interface NmxBottomNavigationBarItemData {
  key: string
  label: string
  icon?: NmxIconFontSymbol
  disabled?: boolean
  ariaLabel?: string
}

export interface NmxBottomNavigationBarItemProps extends WithBaseProps {
  icon?: NmxIconFontSymbol
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}
