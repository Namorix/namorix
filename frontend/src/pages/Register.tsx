import React, { useEffect, useState } from "react"
import { AuthView } from "../components"
import {
  type NmxFormSubmitEvent,
  NmxButton,
  NmxForm,
  NmxFormActions,
  NmxFormField,
  NmxFormInput,
  NmxCardContent,
  NmxCard,
  NmxCardBody,
  NmxCardHeader,
  NmxCardFooter,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { authController } from "../controllers"
import {
  AuthConstraints,
  DefaultPaths,
  nmxToast,
  resolveError,
  useNeedsRegisterStore,
  validate,
  ValidationFields,
} from "@namorix/core"

export const Register: React.FC = () => {
  const { t } = useTranslation()
  const [username, setUsername] = useState("IzeroCs")
  const [password, setPassword] = useState("12345678")
  const [confirmPassword, setConfirmPassword] = useState("12345678")
  const [email, setEmail] = useState("izero.cs@gmail.com")
  const [name, setName] = useState("Nguyễn Danh Nam")
  const [busy, setBusy] = useState(false)
  const needsRegister = useNeedsRegisterStore()
  const navigate = useNavigate()

  useEffect(() => {
    nmxToast.warning(t("auth.register.initialRegistration"))
  }, [])

  const handleSubmit = async (e: NmxFormSubmitEvent) => {
    e.preventDefault()

    const error = validate(t)
      .required(ValidationFields.USERNAME, username)
      .required(ValidationFields.PASSWORD, password)
      .required(ValidationFields.CONFIRM_PASSWORD, confirmPassword)
      .required(ValidationFields.EMAIL, email)
      .required(ValidationFields.NAME, name)
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
      .maxLength(ValidationFields.EMAIL, email, AuthConstraints.email.maxLength)
      .minLength(ValidationFields.NAME, name, AuthConstraints.name.minLength)
      .maxLength(ValidationFields.NAME, name, AuthConstraints.name.maxLength)
      .equal(ValidationFields.CONFIRM_PASSWORD, confirmPassword, password)
      .first()

    if (error) {
      return nmxToast.error(error)
    }

    setBusy(true)

    try {
      await authController.register(username, password, email, name)
      nmxToast.success(t("auth.register.success"))
      navigate(DefaultPaths.LOGIN)
    } catch (err: unknown) {
      nmxToast.error(resolveError(t, err, "auth.register.errors.generic"))
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
            title={
              !needsRegister
                ? t("auth.register.title")
                : t("auth.register.titleAdministrator")
            }
            description={t("auth.register.description")}
          />
          <NmxCardBody>
            <NmxForm onSubmit={handleSubmit}>
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
                label={t("auth.register.emailLabel")}
                controlId="nmx-auth-email"
                required
              >
                <NmxFormInput
                  id="nmx-auth-email"
                  name="email"
                  type="email"
                  placeholder={t("auth.register.emailPlaceholder")}
                  value={email}
                  disabled={busy}
                  onValueChange={setEmail}
                  required
                />
              </NmxFormField>
              <NmxFormField
                label={t("auth.register.nameLabel")}
                controlId="nmx-auth-display-name"
                required
              >
                <NmxFormInput
                  id="nmx-auth-display-name"
                  name="name"
                  type="text"
                  placeholder={t("auth.register.namePlaceholder")}
                  value={name}
                  disabled={busy}
                  onValueChange={setName}
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
