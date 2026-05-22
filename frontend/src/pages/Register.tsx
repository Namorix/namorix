import React, { useEffect, useState } from "react"
import { AuthView } from "../components"
import {
  type NmxFormSubmitEvent,
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormField,
  NmxFormInput,
  NmxInlineAlert,
  NmxCardContent,
  NmxCard,
  NmxCardBody,
  NmxCardHeader,
  NmxCardFooter,
  type NmxInlineAlertState,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { authController } from "../controllers"
import {
  AuthConstraints,
  authService,
  DefaultPaths,
  resolveError,
  validate,
  ValidationFields,
} from "@namorix/core"

export const Register: React.FC = () => {
  const { t } = useTranslation()
  const [username, setUsername] = useState("IzeroCs")
  const [password, setPassword] = useState("12345678")
  const [confirmPassword, setConfirmPassword] = useState("12345678")
  const [busy, setBusy] = useState(false)
  const [alert, setAlert] = useState<NmxInlineAlertState | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    authService.checkHasUsers().then((hasUsers) => {
      if (!hasUsers) {
        setAlert({
          semantic: "warning",
          message: t("auth.register.initialRegistration"),
        })
      }
    })
  }, [setAlert, t])

  const handleSubmit = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()

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
      return setAlert({ semantic: "error", message: error })
    }

    setBusy(true)

    try {
      await authController.register(username, password)
      setAlert({ semantic: "success", message: t("auth.register.success") })
      setTimeout(() => {
        navigate(DefaultPaths.LOGIN)
      }, 2000)
    } catch (err: unknown) {
      setAlert({
        semantic: "error",
        message: resolveError(t, err, "auth.register.errors.generic"),
      })
    }

    setBusy(false)
  }

  return (
    <AuthView
      heroTitle={t("auth.register.heroTitle")}
      heroDescription={t("auth.register.heroDescription")}
    >
      <NmxCard>
        <NmxCardContent>
          <NmxCardHeader
            title={t("auth.register.title")}
            description={t("auth.register.description")}
          />
          <NmxCardBody>
            <NmxForm onSubmit={handleSubmit}>
              <NmxInlineAlert
                semantic={alert?.semantic}
                message={alert?.message}
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
                  type="submit"
                  label={t("auth.register.buttonLabel")}
                  disabled={busy}
                  fullWidth
                  uppercase
                />
              </NmxFormActions>
              <NmxCardFooter className="nmx-auth-view__card__footer">
                <span>{t("auth.register.secondaryText")}</span>
                <Link
                  to={DefaultPaths.LOGIN}
                  className="nmx-auth-view__secondary-link"
                >
                  {t("auth.register.secondaryActionLabel")}
                </Link>
              </NmxCardFooter>
            </NmxForm>
          </NmxCardBody>
        </NmxCardContent>
      </NmxCard>
    </AuthView>
  )
}
