import type React from "react"
import { AuthPage } from "../components"
import {
  type NmxFormSubmitEvent,
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormField,
  NmxFormInput,
  NmxInlineAlert,
  NmxToggle,
  NmxCardContent,
  NmxCard,
  NmxCardBody,
  NmxCardHeader,
  NmxCardFooter,
} from "@namorix/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import {
  AuthConstraints,
  DefaultPaths,
  validate,
  ValidationFields,
} from "@namorix/core"
import { authController } from "../controllers/auth.controller"
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
        navigate(DefaultPaths.HOME)
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
      <NmxCard>
        <NmxCardContent>
          <NmxCardHeader
            title={t("auth.login.title")}
            description={t("auth.login.description")}
          />
          <NmxCardBody>
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
              <NmxCardFooter className="nmx-auth-page__card__footer">
                <span>{t("auth.login.secondaryText")}</span>
                <Link
                  to={DefaultPaths.REGISTER}
                  className="nmx-auth-page__secondary-link"
                >
                  {t("auth.login.secondaryActionLabel")}
                </Link>
              </NmxCardFooter>
            </NmxForm>
          </NmxCardBody>
        </NmxCardContent>
      </NmxCard>
    </AuthPage>
  )
}
