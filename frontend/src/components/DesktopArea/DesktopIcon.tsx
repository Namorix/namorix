import type { DesktopIconData } from "./DesktopArea.types"
import React from "react"

interface DesktopIconProps {
  icon: DesktopIconData
  onOpen: (id: string) => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, onOpen }) => (
  <button
    className="nmx-desktop-area__icon"
    type="button"
    onDoubleClick={() => onOpen(icon.id)}
  >
    <span className="nmx-desktop-area__icon-img">{icon.icon}</span>
    <span className="nmx-desktop-area__icon-label">{icon.label}</span>
  </button>
)
