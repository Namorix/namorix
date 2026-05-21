import type { WithBaseProps } from "../../types"
import type { NmxIconFontSymbol } from "../../Primitives"
import type { TFunction } from "@namorix/core"

export interface NmxRailListProps extends WithBaseProps {
  title?: string
  items?: NmxRailItemData[]
  showToggle?: boolean
  activeKey: string
  t?: TFunction
  onActiveTabChange?: (key: string) => void
}

export interface NmxRailItemData<T = string> {
  key: T
  label: string
  icon: NmxIconFontSymbol
}

export interface NmxRailItemProps extends WithBaseProps {
  icon: NmxIconFontSymbol
  label: string
  active?: boolean
  onClick?: () => void
}
