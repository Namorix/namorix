import type { WithBaseProps } from "../../types"
import type { NmxIconFontSymbol } from "../../Primitives"
import type { TFunction } from "@namorix/core"
import type { CSSProperties } from "react"

export interface NmxToolbarListProps extends WithBaseProps {
  items?: NmxToolbarItemData[]
  activeKey?: string
  t?: TFunction
  onActiveTabChange?: (key: string) => void
}

export interface NmxToolbarItemData<T = string> {
  key: T
  label: string
  icon?: NmxIconFontSymbol
  disabled?: boolean
}

export interface NmxToolbarItemProps extends WithBaseProps {
  icon?: NmxIconFontSymbol
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
}
