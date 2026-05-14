import type React from "react"
import { AuthPage } from "../components"
import {
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormCard,
  NmxFormField,
  NmxFormHeader,
  NmxFormInput,
  NmxFormPage,
  NmxInlineAlert,
  NmxToggle,
  type NmxFormSubmitEvent,
} from "@namorix/ui/Primitives"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { AuthConstraints, validate, ValidationFields } from "@namorix/core"
import { authController } from "../assets/controllers/auth.controller"
import { useAuthForm } from "../hooks/useAuthForm"

export const Login: React.FC = () => {
  const { t } = useTranslation()
  const [username, setUsername] = useState("IzeroCs")
  const [password, setPassword] = useState("12345678")
  const [rememberMe, setRememberMe] = useState(false)
  const { busy, alertVariant, alertMessage, setAlert, handlerError } =
    useAuthForm()
  const navigate = useNavigate()

  const handleSubmit = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    setAlert("error", null, true)

    const error = validate(t)
      .required(ValidationFields.USERNAME, username)
      .required(ValidationFields.PASSWORD, password)
      .minLength(
        ValidationFields.USERNAME,
        username,
        AuthConstraints.username.minLength,
      )
      .maxLength(
        ValidationFields.USERNAME,
        username,
        AuthConstraints.username.maxLength,
      )
      .minLength(
        ValidationFields.PASSWORD,
        password,
        AuthConstraints.password.minLength,
      )
      .first()

    if (error) {
      return setAlert("error", error)
    }

    try {
      await authController.login(username, password, rememberMe)
      setAlert("success", t("auth.login.success"))
      setTimeout(() => {
        navigate("/")
      }, 2000)
    } catch (err: unknown) {
      handlerError(err, t, "auth.login.errors.generic")
    }
  }

  return (
    <AuthPage
      heroTitle={t("auth.login.heroTitle")}
      heroDescription={t("auth.login.heroDescription")}
    >
      <NmxFormCard className="nmx-auth-page__card">
        <NmxFormPage className="nmx-auth-page__page">
          <NmxFormHeader
            title={t("auth.login.title")}
            description={t("auth.login.description")}
          />
          <NmxForm onSubmit={handleSubmit}>
            <NmxInlineAlert
              variant={alertVariant}
              message={alertMessage}
              shouldRender={!!alertMessage}
            />
            <NmxFormField
              label={t("auth.login.usernameLabel")}
              controlId="nmx-auth-username"
              required
            >
              <NmxFormInput
                id="nmx-auth-username"
                name="username"
                type="text"
                placeholder={t("auth.login.usernamePlaceholder")}
                value={username}
                disabled={busy}
                onValueChange={(value: string) => setUsername(value)}
                required
              />
            </NmxFormField>
            <NmxFormField
              label={t("auth.login.passwordLabel")}
              controlId="nmx-auth-password"
              required
            >
              <NmxFormInput
                id="nmx-auth-password"
                name="password"
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                value={password}
                disabled={busy}
                onValueChange={(value: string) => setPassword(value)}
                required
              />
            </NmxFormField>
            <NmxToggle
              name="remember"
              label={t("auth.login.rememberLabel")}
              onCheckedChanged={(checked) => setRememberMe(checked)}
            />
            <NmxFormActions>
              <NmxButton
                variant="primary"
                type="submit"
                label={t("auth.login.buttonLabel")}
                disabled={busy}
                fullWidth
                uppercase
              />
            </NmxFormActions>
            <div className="nmx-auth-page__secondary-actions">
              <span>{t("auth.login.secondaryText")}</span>
              <Link to="/register" className="nmx-auth-page__secondary-link">
                {t("auth.login.secondaryActionLabel")}
              </Link>
            </div>
          </NmxForm>
        </NmxFormPage>
      </NmxFormCard>
    </AuthPage>
  )
}
