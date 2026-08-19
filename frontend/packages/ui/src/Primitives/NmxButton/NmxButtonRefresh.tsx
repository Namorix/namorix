import React from "react"
import { NmxIconFontSymbol } from "../NmxIcon"
import {
  NmxButtonAction,
  type NmxButtonActionBaseProps,
} from "./NmxButtonAction"

export const NmxButtonRefresh: React.FC<NmxButtonActionBaseProps> = ({
  onClick,
  title = null,
}) => (
  <NmxButtonAction
    icon={NmxIconFontSymbol.REFRESH}
    title={title}
    onClick={onClick}
  />
)
