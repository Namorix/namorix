import React from "react"
import { NmxIconFontSymbol } from "../NmxIcon"
import {
  NmxButtonAction,
  type NmxButtonActionBaseProps,
} from "./NmxButtonAction"

export const NmxButtonClear: React.FC<NmxButtonActionBaseProps> = ({
  onClick,
  title = null,
}) => (
  <NmxButtonAction
    title={title}
    icon={NmxIconFontSymbol.DELETE}
    onClick={onClick}
    className="nmx-button__clear"
    variant="ghost"
    semantic="error"
  />
)
