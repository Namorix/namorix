import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ApiAuthRoutes,
  getApiBaseUrl,
  http,
  ApiError,
  ApiUserRoutes,
} from "@namorix/core"
import {
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormField,
  NmxFormInput,
  NmxInlineAlert,
  type NmxFormSubmitEvent,
} from "@namorix/ui"

const API = getApiBaseUrl()

interface UserInfo {
  id: number
  username: string
  role: number
}

export const SettingsAccount: React.FC = () => {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<{
    semantic: "success" | "error"
    message: string
  } | null>(null)

  useEffect(() => {
    http
      .url(API + ApiAuthRoutes.session)
      .get()
      .json<UserInfo>()
      .then((r) => r.success && setUser(r.data))
  }, [])

  const handleChangePassword = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    setAlert(null)

    if (newPassword !== confirmPassword) {
      setAlert({
        semantic: "error",
        message: t("addon.settings.account.mismatch"),
      })
      return
    }

    setBusy(true)

    try {
      const res = await http
        .url(API + ApiUserRoutes.password)
        .put({ currentPassword, newPassword })
        .json()
      if (!res.success) throw ApiError.fromResponse(res)
      setAlert({
        semantic: "success",
        message: t("addon.settings.account.success"),
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setAlert({
        semantic: "error",
        message: t("addon.settings.account.error"),
      })
    }
    setBusy(false)
  }

  return (
    <div className="nmx-addon-form__content nmx-addon-setting__account">
      <NmxForm onSubmit={handleChangePassword}>
        <NmxInlineAlert
          semantic={alert?.semantic}
          message={alert?.message}
          shouldRender={!!alert}
        />
        <NmxFormField label={t("addon.settings.account.currentPassword")}>
          <NmxFormInput
            type="password"
            value={currentPassword}
            onValueChange={setCurrentPassword}
            disabled={busy}
          />
        </NmxFormField>
        <NmxFormField label={t("addon.settings.account.newPassword")}>
          <NmxFormInput
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
            disabled={busy}
          />
        </NmxFormField>
        <NmxFormField label={t("addon.settings.account.confirmPassword")}>
          <NmxFormInput
            type="password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            disabled={busy}
          />
        </NmxFormField>
        <NmxFormActions>
          <NmxButton
            type="submit"
            disabled={busy}
            label={t("addon.settings.save")}
          />
        </NmxFormActions>
      </NmxForm>
    </div>
  )
}
