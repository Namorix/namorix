import React from "react"
import { NmxIconFont, NmxIconFontSymbol } from "../NmxIcon"
import { NmxButton } from "./NmxButton"

interface NmxButtonClearProps {
  onClick?: () => void
  title?: string
}

export const NmxButtonClear: React.FC<NmxButtonClearProps> = ({
  onClick,
  title = "Clear",
}) => (
  <NmxButton
    title={title}
    onClick={onClick}
    className="nmx-button__clear"
    variant="ghost"
    semantic="error"
  >
    <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
  </NmxButton>
)
