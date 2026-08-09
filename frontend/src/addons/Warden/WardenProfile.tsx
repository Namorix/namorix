import React from "react"
import { useTranslation } from "react-i18next"
import { NmxSegmentedGroup } from "@namorix/ui"
import type { WdSecurityProfile } from "./Warden.types"

export interface WardenProfileProps {
  value: WdSecurityProfile
  onChange: (profile: WdSecurityProfile) => void
}

const PROFILE_OPTIONS: WdSecurityProfile[] = ["low", "medium", "high", "custom"]

export const WardenProfile: React.FC<WardenProfileProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation()

  return (
    <NmxSegmentedGroup<WdSecurityProfile>
      value={value}
      onChange={onChange}
      options={PROFILE_OPTIONS.map((p) => ({
        value: p,
        label: t(`addon.warden.profile.${p}`),
      }))}
    />
  )
}
