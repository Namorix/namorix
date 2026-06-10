import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  UserRole,
  validate,
  ValidationFields,
  AuthConstraints,
  useUserStore,
  resolveError,
  nmxToast,
} from "@namorix/core"
import {
  NmxButton,
  NmxFormInput,
  NmxIconFont,
  NmxIconFontSymbol,
  NmxMetaList,
  NmxMetaItem,
  NmxBadge,
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
  const [email, setEmail] = useState(user?.email ?? "")
  const [name, setName] = useState(user?.name ?? "")
  const [profileBusy, setProfileBusy] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleUpdateProfile = async (e: React.MouseEvent) => {
    e.preventDefault()

    const error = validate(t)
      .required(ValidationFields.EMAIL, email)
      .required(ValidationFields.NAME, name)
      .maxLength(ValidationFields.EMAIL, email, AuthConstraints.email.maxLength)
      .minLength(ValidationFields.NAME, name, AuthConstraints.name.minLength)
      .maxLength(ValidationFields.NAME, name, AuthConstraints.name.maxLength)
      .first()

    if (error) {
      return nmxToast.error(error)
    }

    setProfileBusy(true)

    try {
      await settingsController.updateProfile(email, name)
      nmxToast.success(t("addon.settings.account.profileUpdated"))
    } catch (err: unknown) {
      nmxToast.error(
        resolveError(t, err, "addon.settings.account.profileUpdateError"),
      )
    }

    setProfileBusy(false)
  }

  const handleChangePassword = async (e: React.MouseEvent) => {
    e.preventDefault()

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
      return nmxToast.error(error)
    }

    setBusy(true)

    try {
      await settingsController.changePassword(currentPassword, newPassword)

      nmxToast.success(t("addon.settings.account.passwordUpdated"))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: unknown) {
      nmxToast.error(
        resolveError(t, err, "addon.settings.account.passwordUpdatedError"),
      )
    }

    setBusy(false)
  }

  return (
    <>
      <NmxSettingsSection title={t("addon.settings.account.profileSection")}>
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
                >
                  {user?.role === UserRole.Admin
                    ? t("user.role.admin")
                    : t("user.role.user")}
                </NmxBadge>
              </NmxMetaItem>
            </NmxMetaList>
          </div>
          <NmxSettingsRow
            label={t("addon.settings.account.email")}
            description={t("addon.settings.account.emailDesc")}
          >
            <NmxFormInput
              type="email"
              value={email}
              onValueChange={setEmail}
              disabled={profileBusy}
            />
          </NmxSettingsRow>
          <NmxSettingsRow
            label={t("addon.settings.account.name")}
            description={t("addon.settings.account.nameDesc")}
          >
            <NmxFormInput
              type="text"
              value={name}
              onValueChange={setName}
              disabled={profileBusy}
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection>
        <NmxButton
          onClick={handleUpdateProfile}
          disabled={profileBusy}
          label={t("addon.settings.account.saveProfile")}
          fullWidth
          uppercase
        />
      </NmxSettingsSection>

      <NmxSettingsSection
        title={t("addon.settings.account.changePasswordSection")}
      >
        <NmxSettingsCard>
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
            description={t("addon.settings.account.confirmPasswordDesc")}
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
          label={t("addon.settings.account.savePassword")}
          fullWidth
          uppercase
        />
      </NmxSettingsSection>
    </>
  )
}
