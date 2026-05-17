import type { DesktopIconData } from "./DesktopArea.types"
import React from "react"
import { NmxIconSvg } from "@namorix/ui"

interface DesktopIconProps {
  icon: DesktopIconData
  onOpen: (id: string) => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, onOpen }) => (
  <button
    className="nmx-desktop-area__item"
    type="button"
    onDoubleClick={() => onOpen(icon.id)}
  >
    <NmxIconSvg symbol={icon.icon} className="nmx-desktop-area__icon" />
    <span className="nmx-desktop-area__icon-label">{icon.label}</span>
  </button>
)
