import React from "react"
import { NmxIconFontSymbol } from "../NmxIcon"
import { NmxButtonAction } from "./NmxButtonAction"

interface NmxButtonLiveProps {
  live: boolean
  onToggle?: (e: React.MouseEvent) => void
}

export const NmxButtonLive: React.FC<NmxButtonLiveProps> = ({
  live,
  onToggle,
}) => (
  <NmxButtonAction
    icon={live ? NmxIconFontSymbol.PAUSE : NmxIconFontSymbol.PLAY}
    tooltip={live ? "Pause live" : "Resume live"}
    onClick={onToggle}
    semantic={live ? "success" : "error"}
    variant="ghost"
  />
)
