import React, { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  NmxAlertDialog,
  NmxAlign,
  NmxBadge,
  NmxButton,
  NmxDataTable,
  type NmxDataTableColumn,
  type NmxFallback,
  NmxForm,
  NmxFormField,
  NmxFormInput,
  NmxIconFont,
  NmxIconFontSymbol,
  type NmxSemanticColor,
  NmxSelect,
  type NmxSelectData,
} from "@namorix/ui"
import { formatCustomError, nmxToast, useDateTimeFormat } from "@namorix/core"
import {
  type AccessPolicy,
  type AccessPolicyType,
  type CreateAccessPolicyPayload,
  frontgateController,
} from "./frontgate.controller"
import { FrontgateErrorCodes } from "./Frontgate.types"

function parseRulesToLines(rulesJson: string): string {
  try {
    const arr = JSON.parse(rulesJson)
    if (Array.isArray(arr)) return arr.join("\n")
  } catch {
    /* rulesJson không phải array hợp lệ */
  }
  return ""
}

function serializeLinesToArray(rulesText: string): string {
  return JSON.stringify(
    rulesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

function parseBasicAuthUsername(rulesJson: string): string {
  try {
    const obj = JSON.parse(rulesJson)
    return typeof obj?.username === "string" ? obj.username : ""
  } catch {
    return ""
  }
}

const typeSemantic: Record<AccessPolicyType, NmxSemanticColor> = {
  ipAllowlist: "success",
  ipDenylist: "error",
  geoBlock: "info",
  basicAuth: "warning",
}

export const FrontgateAccessPolicy: React.FC = () => {
  const { t } = useTranslation()
  const { dateTime } = useDateTimeFormat()
  const [policies, setPolicies] = useState<AccessPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<AccessPolicy | null>(null)

  const [deletingPolicy, setDeletingPolicy] = useState<AccessPolicy | null>(
    null,
  )
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState<AccessPolicyType>("ipAllowlist")
  const [formRulesText, setFormRulesText] = useState("")
  const [formUsername, setFormUsername] = useState("")
  const [formPassword, setFormPassword] = useState("")

  const fetchPolicies = useCallback(async () => {
    setError(undefined)

    if (policies.length <= 0) {
      setLoading(true)
    }

    frontgateController
      .listAccessPolicies()
      .then(setPolicies)

      .finally(() => setLoading(false))
  }, [policies.length])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPolicies().catch(setError)
    }, 0)
    return () => clearTimeout(timeout)
  }, [fetchPolicies])

  const resetForm = useCallback(() => {
    setFormName("")
    setFormType("ipAllowlist")
    setFormRulesText("")
    setFormUsername("")
    setFormPassword("")
  }, [])

  const fillForm = useCallback((policy: AccessPolicy) => {
    setFormName(policy.name)
    setFormType(policy.type)
    setFormPassword("")

    if (policy.type === "basicAuth") {
      setFormUsername(parseBasicAuthUsername(policy.rulesJson))
      setFormRulesText("")
    } else {
      setFormRulesText(parseRulesToLines(policy.rulesJson))
      setFormUsername("")
    }
  }, [])

  const handleDialogOpen = useCallback(() => {
    resetForm()
    setEditingPolicy(null)
    setShowAddDialog(true)
  }, [resetForm])

  const handleDialogClose = useCallback(() => {
    setShowAddDialog(false)
    setEditingPolicy(null)
  }, [])

  const handleConfirm = useCallback(() => {
    const name = formName.trim()
    if (!name) return
    if (formType === "basicAuth" && !formUsername.trim()) return
    if (formType === "basicAuth" && !editingPolicy && !formPassword.trim())
      return

    if (formType !== "basicAuth") {
      const lines = formRulesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      if (lines.length <= 0) return
    }

    const rulesJson =
      formType === "basicAuth"
        ? editingPolicy && !formPassword.trim()
          ? editingPolicy.rulesJson // giữ hash cũ
          : JSON.stringify({
              username: formUsername.trim(),
              password: formPassword,
            })
        : serializeLinesToArray(formRulesText)

    const payload: CreateAccessPolicyPayload = {
      name,
      type: formType,
      rulesJson,
    }

    setFormSubmitting(true)
    const request = editingPolicy
      ? frontgateController.updateAccessPolicy(editingPolicy.id, payload)
      : frontgateController.createAccessPolicy(payload)

    request
      .then(() => {
        nmxToast.success(
          t("addon.frontgate.pages.accessPolicy.feedback.saveSuccess"),
        )
        handleDialogClose()
        return fetchPolicies()
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t(
            editingPolicy
              ? "addon.frontgate.pages.accessPolicy.feedback.updateError"
              : "addon.frontgate.pages.accessPolicy.feedback.createError",
          ),
        ),
      )
      .finally(() => setFormSubmitting(false))
  }, [
    formName,
    formType,
    formRulesText,
    formUsername,
    formPassword,
    editingPolicy,
    handleDialogClose,
    fetchPolicies,
    t,
  ])

  const handleDelete = useCallback((policy: AccessPolicy) => {
    setDeletingPolicy(policy)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingPolicy) return
    setDeleteSubmitting(true)
    frontgateController
      .deleteAccessPolicy(deletingPolicy.id)
      .then(() => {
        nmxToast.success(
          t("addon.frontgate.pages.accessPolicy.feedback.deleteSuccess"),
        )
        setDeletingPolicy(null)
        return fetchPolicies()
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes),
          t("addon.frontgate.pages.accessPolicy.feedback.deleteError"),
        ),
      )
      .finally(() => setDeleteSubmitting(false))
  }, [deletingPolicy, fetchPolicies, t])

  const typeOptions: NmxSelectData<AccessPolicyType>[] = [
    {
      value: "ipAllowlist",
      label: t(
        "addon.frontgate.pages.accessPolicy.fields.typeOptions.ipAllowlist",
      ),
    },
    {
      value: "ipDenylist",
      label: t(
        "addon.frontgate.pages.accessPolicy.fields.typeOptions.ipDenylist",
      ),
    },
    {
      value: "geoBlock",
      label: t(
        "addon.frontgate.pages.accessPolicy.fields.typeOptions.geoBlock",
      ),
    },
    {
      value: "basicAuth",
      label: t(
        "addon.frontgate.pages.accessPolicy.fields.typeOptions.basicAuth",
      ),
    },
  ]

  const renderRulesSummary = (policy: AccessPolicy): string => {
    if (policy.type === "basicAuth")
      return `${t("addon.frontgate.pages.accessPolicy.fields.username")}: ${parseBasicAuthUsername(policy.rulesJson)}`
    try {
      const arr = JSON.parse(policy.rulesJson)
      if (Array.isArray(arr)) return arr.join(", ")
    } catch {
      /* ignore */
    }
    return policy.rulesJson
  }

  const columns: NmxDataTableColumn<AccessPolicy>[] = [
    {
      header: t("addon.frontgate.pages.accessPolicy.fields.name"),
      renderCell: (row) => (
        <div>
          <div>{row.name}</div>
          <div className="nmx-addon-frontgate__created">
            {t("addon.frontgate.pages.reverseProxy.fields.createdAt", {
              time: dateTime(row.createdAt),
            })}
          </div>
        </div>
      ),
      grow: 2,
      enableUserSelectCell: true,
    },
    {
      header: t("addon.frontgate.pages.accessPolicy.fields.type"),
      renderCell: (row) => (
        <NmxBadge semantic={typeSemantic[row.type]} size="sm">
          {t(
            `addon.frontgate.pages.accessPolicy.fields.typeOptions.${row.type}`,
          )}
        </NmxBadge>
      ),
      grow: 1,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
    },
    {
      header: t("addon.frontgate.pages.accessPolicy.fields.rules"),
      renderCell: (row) => renderRulesSummary(row),
      grow: 4,
      enableUserSelectCell: true,
    },
    {
      header: "",
      renderCell: (row) => (
        <NmxButton
          variant="ghost"
          semantic="error"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(row)
          }}
          data-row-action
        >
          <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
        </NmxButton>
      ),
      grow: 0,
      alignHeader: "center",
      alignCell: "center",
      disableEllipsisCell: true,
      btnIsIcon: true,
    },
  ]

  const fallbackConditions: NmxFallback[] = [
    {
      state: "loading",
      condition: loading,
      content: t("addon.frontgate.pages.accessPolicy.fallbacks.loading"),
    },
    {
      state: "error",
      condition: error,
      content: t("addon.frontgate.pages.accessPolicy.fallbacks.error"),
    },
    {
      state: "empty",
      condition: !loading && policies.length === 0,
      content: t("addon.frontgate.pages.accessPolicy.fallbacks.empty"),
    },
  ]

  return (
    <div className="nmx-addon-frontgate__page">
      <NmxAlign direction="row" justify="end">
        <NmxButton onClick={handleDialogOpen} semantic="success">
          <NmxIconFont symbol={NmxIconFontSymbol.ADD} />
          <span>
            {t("addon.frontgate.pages.accessPolicy.actions.addPolicy")}
          </span>
        </NmxButton>
        <NmxButton onClick={() => void fetchPolicies()}>
          <NmxIconFont symbol={NmxIconFontSymbol.REFRESH} />
          <span>{t("addon.frontgate.pages.accessPolicy.actions.refresh")}</span>
        </NmxButton>
      </NmxAlign>
      <div className="nmx-addon-frontgate__list">
        <NmxDataTable
          columns={columns}
          rows={policies}
          fallbackConditions={fallbackConditions}
          clickableRows={true}
          onRowClick={(row) => {
            setEditingPolicy(row)
            fillForm(row)
            setShowAddDialog(true)
          }}
          className="nmx-addon-page__data-table"
        />
      </div>

      <NmxAlertDialog
        open={showAddDialog}
        title={t(
          editingPolicy
            ? "addon.frontgate.pages.accessPolicy.actions.editPolicy"
            : "addon.frontgate.pages.accessPolicy.actions.addPolicy",
        )}
        onClose={handleDialogClose}
        onConfirm={handleConfirm}
        loading={formSubmitting}
        confirmLabel={t("addon.frontgate.pages.accessPolicy.actions.save")}
      >
        <NmxForm>
          <NmxFormField
            label={t("addon.frontgate.pages.accessPolicy.fields.name")}
            required
          >
            <NmxFormInput
              value={formName}
              onValueChange={setFormName}
              placeholder={t(
                "addon.frontgate.pages.accessPolicy.fields.namePlaceholder",
              )}
            />
          </NmxFormField>
          <NmxFormField
            label={t("addon.frontgate.pages.accessPolicy.fields.type")}
            required
          >
            <NmxSelect
              value={formType}
              options={typeOptions}
              onChange={(v) => {
                setFormType(v)
                if (v === "basicAuth") {
                  setFormRulesText("")
                } else {
                  setFormUsername("")
                  setFormPassword("")
                }
              }}
            />
          </NmxFormField>

          {formType === "basicAuth" ? (
            <>
              <NmxFormField
                label={t("addon.frontgate.pages.accessPolicy.fields.username")}
                required
              >
                <NmxFormInput
                  value={formUsername}
                  onValueChange={setFormUsername}
                  placeholder={t(
                    "addon.frontgate.pages.accessPolicy.fields.usernamePlaceholder",
                  )}
                />
              </NmxFormField>
              <NmxFormField
                label={t("addon.frontgate.pages.accessPolicy.fields.password")}
                required={!editingPolicy}
              >
                <NmxFormInput
                  type="password"
                  value={formPassword}
                  onValueChange={setFormPassword}
                  placeholder={t(
                    editingPolicy
                      ? "addon.frontgate.pages.accessPolicy.fields.passwordPlaceholderKeep"
                      : "addon.frontgate.pages.accessPolicy.fields.passwordPlaceholder",
                  )}
                />
              </NmxFormField>
            </>
          ) : (
            <NmxFormField
              label={t(
                formType === "geoBlock"
                  ? "addon.frontgate.pages.accessPolicy.fields.countryCodes"
                  : "addon.frontgate.pages.accessPolicy.fields.ipList",
              )}
              required
            >
              <textarea
                className="nmx-form-input"
                rows={6}
                value={formRulesText}
                onChange={(e) => setFormRulesText(e.target.value)}
                placeholder={t(
                  formType === "geoBlock"
                    ? "addon.frontgate.pages.accessPolicy.fields.countryCodesPlaceholder"
                    : "addon.frontgate.pages.accessPolicy.fields.ipListPlaceholder",
                )}
              />
            </NmxFormField>
          )}
        </NmxForm>
      </NmxAlertDialog>

      <NmxAlertDialog
        open={deletingPolicy !== null}
        title={t("addon.frontgate.pages.accessPolicy.actions.deletePolicy")}
        confirmLabel={t("addon.frontgate.pages.accessPolicy.actions.delete")}
        confirmSemantic="error"
        onClose={() => setDeletingPolicy(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteSubmitting}
        markupToHtmlEnabled={true}
      >
        <p>
          {t("addon.frontgate.pages.accessPolicy.feedback.deleteConfirm", {
            name: deletingPolicy?.name,
          })}
        </p>
      </NmxAlertDialog>
    </div>
  )
}
