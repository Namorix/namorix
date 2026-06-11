import React from "react"
import { NmxIconFont, NmxIconFontSymbol } from "../NmxIcon"
import { NmxButton } from "./NmxButton"

interface NmxButtonLiveProps {
  live: boolean
  onToggle?: () => void
}

export const NmxButtonLive: React.FC<NmxButtonLiveProps> = ({
  live,
  onToggle,
}) => (
  <NmxButton
    title={live ? "Pause live" : "Resume live"}
    onClick={onToggle}
    className="nmx-button__live"
    semantic={live ? "success" : "error"}
    variant="ghost"
  >
    <NmxIconFont
      symbol={!live ? NmxIconFontSymbol.PLAY : NmxIconFontSymbol.PAUSE}
    />
  </NmxButton>
)
