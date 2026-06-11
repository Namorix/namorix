import React, { useRef } from "react"
import { NmxIconSvg } from "@namorix/ui"
import type { AddonItem, OnOpenApp } from "../../types"
import { useTranslation } from "react-i18next"
import { resolveAddonLocaleTitle } from "../../utils"

interface DesktopIconProps {
  addon: AddonItem
  onOpen: OnOpenApp
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ addon, onOpen }) => {
  const { t } = useTranslation()
  const btnRef = useRef<HTMLButtonElement>(null)
  const lastTap = useRef(0)

  const handleClick = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      const rect = btnRef.current?.getBoundingClientRect()
      onOpen(addon, rect)
    }
    lastTap.current = now
  }

  return (
    <button
      ref={btnRef}
      className="nmx-desktop-area__item"
      type="button"
      onClick={handleClick}
    >
      <NmxIconSvg symbol={addon.icon} className="nmx-desktop-area__icon" />
      <span className="nmx-desktop-area__icon-label">
        {resolveAddonLocaleTitle(t, addon) ?? addon.displayName}
      </span>
    </button>
  )
}
