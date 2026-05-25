import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  UserRole,
  validate,
  ValidationFields,
  AuthConstraints,
  useUserStore,
  resolveError,
} from "@namorix/core"
import {
  NmxButton,
  NmxFormInput,
  NmxInlineAlert,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMetaList,
  NmxMetaItem,
  NmxBadge,
  type NmxInlineAlertState,
  NmxSettingsSection,
  NmxSettingsCard,
  NmxSettingsRow,
} from "@namorix/ui"
import { settingsController } from "./settings.controller"

export const SettingsAccount: React.FC = () => {
  const { t } = useTranslation()
  const user = useUserStore()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<NmxInlineAlertState | null>(null)

  const handleChangePassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    setAlert(null)

    const error = validate(t)
      .required(ValidationFields.CURRENT_PASSWORD, currentPassword)
      .required(ValidationFields.PASSWORD, newPassword)
      .required(ValidationFields.CONFIRM_PASSWORD, confirmPassword)
      .minLength(
        ValidationFields.NEW_PASSWORD,
        newPassword,
        AuthConstraints.password.minLength,
      )
      .equal(ValidationFields.CONFIRM_PASSWORD, confirmPassword, newPassword)
      .first()

    if (error) {
      return setAlert({ semantic: "error", message: error })
    }

    setBusy(true)

    try {
      await settingsController.changePassword(currentPassword, newPassword)

      setAlert({
        semantic: "success",
        message: t("addon.settings.account.success"),
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      setAlert({
        semantic: "error",
        message: resolveError(t, err, "addon.settings.account.error"),
      })
    }

    setBusy(false)
  }

  return (
    <>
      <NmxSettingsSection title={t("addon.settings.account.title")}>
        <NmxSettingsCard>
          <div className="nmx-addon-setting__profile-header">
            <div className="nmx-addon-setting__avatar">
              <NmxIconFont symbol={NmxIconFontSymbol.USER} />
            </div>
            <NmxMetaList className="nmx-addon-setting__meta-list">
              <NmxMetaItem
                value={user?.username}
                className="nmx-addon-setting__meta-value"
              />
              <NmxMetaItem>
                <NmxBadge
                  semantic={user?.role === UserRole.Admin ? "success" : "info"}
                  className="nmx-addon-setting__meta-role"
                >
                  {user?.role === UserRole.Admin
                    ? t("user.role.admin")
                    : t("user.role.user")}
                </NmxBadge>
              </NmxMetaItem>
            </NmxMetaList>
          </div>

          <NmxInlineAlert semantic={alert?.semantic} message={alert?.message} />
          <NmxSettingsRow
            label={t("addon.settings.account.currentPassword")}
            description={t("addon.settings.account.currentPasswordDesc")}
          >
            <NmxFormInput
              type="password"
              value={currentPassword}
              onValueChange={setCurrentPassword}
              disabled={busy}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.account.newPassword")}
            description={t("addon.settings.account.newPasswordDesc", {
              count: AuthConstraints.password.minLength,
            })}
          >
            <NmxFormInput
              type="password"
              value={newPassword}
              onValueChange={setNewPassword}
              disabled={busy}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.account.confirmPassword")}
            description={t("addon.settings.account.confirmPassword")}
          >
            <NmxFormInput
              type="password"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              disabled={busy}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection>
        <NmxButton
          onClick={handleChangePassword}
          disabled={busy}
          label={t("addon.settings.save")}
          fullWidth
          uppercase
        />
      </NmxSettingsSection>
    </>
  )
}
