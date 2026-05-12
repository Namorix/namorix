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
import { AuthConstraints } from "@namorix/shared"
import { validate, ValidationFields } from "@namorix/core"
import { authController } from "../assets/controllers/auth.controller"
import { useAuthForm } from "../hooks/useAuthForm"

export const SignIn: React.FC = () => {
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
      await authController.signIn(username, password, rememberMe)
      setAlert("success", t("auth.signin.success"))
      setTimeout(() => {
        navigate("/")
      }, 2000)
    } catch (err: unknown) {
      handlerError(err, t, "auth.signin.errors.generic")
    }
  }

  return (
    <AuthPage
      heroTitle={t("auth.signin.heroTitle")}
      heroDescription={t("auth.signin.heroDescription")}
    >
      <NmxFormCard className="nmx-auth-page__card">
        <NmxFormPage className="nmx-auth-page__page">
          <NmxFormHeader
            title={t("auth.signin.title")}
            description={t("auth.signin.description")}
          />
          <NmxForm onSubmit={handleSubmit}>
            <NmxInlineAlert
              variant={alertVariant}
              message={alertMessage}
              shouldRender={!!alertMessage}
            />
            <NmxFormField
              label={t("auth.signin.usernameLabel")}
              controlId="nmx-auth-username"
              required
            >
              <NmxFormInput
                id="nmx-auth-username"
                name="username"
                type="text"
                placeholder={t("auth.signin.usernamePlaceholder")}
                value={username}
                disabled={busy}
                onValueChange={(value: string) => setUsername(value)}
                required
              />
            </NmxFormField>
            <NmxFormField
              label={t("auth.signin.passwordLabel")}
              controlId="nmx-auth-password"
              required
            >
              <NmxFormInput
                id="nmx-auth-password"
                name="password"
                type="password"
                placeholder={t("auth.signin.passwordPlaceholder")}
                value={password}
                disabled={busy}
                onValueChange={(value: string) => setPassword(value)}
                required
              />
            </NmxFormField>
            <NmxToggle
              name="remember"
              label={t("auth.signin.rememberLabel")}
              onCheckedChanged={(checked) => setRememberMe(checked)}
            />
            <NmxFormActions>
              <NmxButton
                variant="primary"
                type="submit"
                label={t("auth.signin.buttonLabel")}
                disabled={busy}
                fullWidth
                uppercase
              />
            </NmxFormActions>
            <div className="nmx-auth-page__secondary-actions">
              <span>{t("auth.signin.secondaryText")}</span>
              <Link to="/signup" className="nmx-auth-page__secondary-link">
                {t("auth.signin.secondaryActionLabel")}
              </Link>
            </div>
          </NmxForm>
        </NmxFormPage>
      </NmxFormCard>
    </AuthPage>
  )
}
