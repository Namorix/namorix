import React, { useEffect, useState } from "react"
import { AuthPage } from "../components"
import {
  NmxForm,
  NmxFormCard,
  NmxFormPage,
  NmxFormHeader,
  NmxInlineAlert,
  NmxFormField,
  NmxFormInput,
  NmxFormActions,
  NmxButton,
  type NmxFormSubmitEvent,
} from "@namorix/ui/Primitives"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { authController } from "../assets/controllers/auth.controller"
import { AuthConstraints } from "@namorix/shared"
import { authService, validate, ValidationFields } from "@namorix/core"
import { useAuthForm } from "../hooks/useAuthForm"

export const Register: React.FC = () => {
  const { t } = useTranslation()
  const [username, setUsername] = useState("IzeroCs")
  const [password, setPassword] = useState("12345678")
  const [confirmPassword, setConfirmPassword] = useState("12345678")
  const { busy, alertVariant, alertMessage, setAlert, handlerError } =
    useAuthForm()
  const navigate = useNavigate()

  useEffect(() => {
    authService.checkHasUsers().then((hasUsers) => {
      if (!hasUsers) {
        setAlert("warning", t("auth.register.initialRegistration"))
      }
    })
  }, [setAlert, t])

  const handleSubmit = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()
    setAlert("error", null, true)

    const error = validate(t)
      .required(ValidationFields.USERNAME, username)
      .required(ValidationFields.PASSWORD, password)
      .required(ValidationFields.CONFIRM_PASSWORD, confirmPassword)
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
      .equal(ValidationFields.CONFIRM_PASSWORD, confirmPassword, password)
      .first()

    if (error) {
      return setAlert("error", error)
    }

    try {
      await authController.register(username, password)
      setAlert("success", t("auth.register.success"))
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (err: unknown) {
      handlerError(err, t, "auth.register.errors.generic")
    }
  }

  return (
    <AuthPage
      heroTitle={t("auth.register.heroTitle")}
      heroDescription={t("auth.register.heroDescription")}
    >
      <NmxFormCard className="nmx-auth-page__card">
        <NmxFormPage className="nmx-auth-page__page">
          <NmxFormHeader
            title={t("auth.register.title")}
            description={t("auth.register.description")}
          />
          <NmxForm onSubmit={handleSubmit}>
            <NmxInlineAlert
              variant={alertVariant}
              message={alertMessage}
              shouldRender={!!alertMessage}
            />
            <NmxFormField
              label={t("auth.register.usernameLabel")}
              controlId="nmx-auth-username"
              required
            >
              <NmxFormInput
                id="nmx-auth-username"
                name="username"
                type="text"
                placeholder={t("auth.register.usernamePlaceholder")}
                value={username}
                disabled={busy}
                onValueChange={(value: string) => setUsername(value)}
                required
              />
            </NmxFormField>
            <NmxFormField
              label={t("auth.register.passwordLabel")}
              controlId="nmx-auth-password"
              required
            >
              <NmxFormInput
                id="nmx-auth-password"
                name="password"
                type="password"
                placeholder={t("auth.register.passwordPlaceholder")}
                value={password}
                disabled={busy}
                onValueChange={(value: string) => setPassword(value)}
                required
              />
            </NmxFormField>
            <NmxFormField
              label={t("auth.register.confirmPasswordLabel")}
              controlId="nmx-auth-confirm-password"
              required
            >
              <NmxFormInput
                id="nmx-auth-confirm-password"
                name="confirm_password"
                type="password"
                placeholder={t("auth.register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                disabled={busy}
                onValueChange={(value: string) => setConfirmPassword(value)}
                required
              />
            </NmxFormField>
            <NmxFormActions>
              <NmxButton
                variant="primary"
                type="submit"
                label={t("auth.register.buttonLabel")}
                disabled={busy}
                fullWidth
                uppercase
              />
            </NmxFormActions>
            <div className="nmx-auth-page__secondary-actions">
              <span>{t("auth.register.secondaryText")}</span>
              <Link to="/login" className="nmx-auth-page__secondary-link">
                {t("auth.register.secondaryActionLabel")}
              </Link>
            </div>
          </NmxForm>
        </NmxFormPage>
      </NmxFormCard>
    </AuthPage>
  )
}
