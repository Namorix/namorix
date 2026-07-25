import React, { useRef } from "react"
import { cx, NmxIconSvg } from "@namorix/ui"
import type { AddonItem, OnOpenApp } from "../../types"
import { useTranslation } from "react-i18next"
import { resolveAddonLocaleTitle } from "../../utils"
import { useDoubleTap } from "@namorix/core/hooks/useDoubleTap"
import { useUserRoleAdmin } from "@namorix/core"

interface DesktopIconProps {
  addon: AddonItem
  onOpen: OnOpenApp
  disabled?: boolean
  onDisabledClick?: (addon: AddonItem) => void
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  addon,
  onOpen,
  disabled = false,
  onDisabledClick,
}) => {
  const { t } = useTranslation()
  const btnRef = useRef<HTMLButtonElement>(null)
  const isUserRoleAdmin = useUserRoleAdmin()

  const handleClick = useDoubleTap(() => {
    if (disabled) {
      onDisabledClick?.(addon)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    onOpen(addon, rect)
  })

  return (
    <button
      ref={btnRef}
      className={cx("nmx-desktop-area__item", {
        "nmx-desktop-area__item--disabled": disabled,
        "nmx-desktop-area__item--role-admin": isUserRoleAdmin,
      })}
      type="button"
      onClick={handleClick}
    >
      <NmxIconSvg
        symbol={addon.icon}
        src={addon.icon}
        className="nmx-desktop-area__icon"
      />
      <span className="nmx-desktop-area__label">
        {resolveAddonLocaleTitle(t, addon) ?? addon.name}
      </span>
    </button>
  )
}
