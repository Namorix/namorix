import React from "react"
import { NmxIconFont, NmxIconFontSymbol } from "../NmxIcon"
import { NmxButton } from "./NmxButton"

interface NmxButtonRefreshProps {
  onClick?: () => void
  title?: string
}

export const NmxButtonRefresh: React.FC<NmxButtonRefreshProps> = ({
  onClick,
  title = "Refresh",
}) => (
  <NmxButton
    title={title}
    onClick={onClick}
    className="nmx-button__refresh"
    variant="ghost"
  >
    <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
  </NmxButton>
)
