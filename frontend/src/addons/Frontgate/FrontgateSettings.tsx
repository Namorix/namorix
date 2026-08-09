import React, { useEffect, useRef, useState } from "react"
import {
  NmxAlertDialog,
  NmxBadge,
  NmxButton,
  NmxFileInput,
  NmxMetaItem,
  NmxMetaList,
  NmxSettingsCard,
  NmxSettingsRow,
  NmxSettingsSection,
} from "@namorix/ui"
import { useTranslation } from "react-i18next"
import { formatCustomError, nmxToast, useDateTimeFormat } from "@namorix/core"
import { type GeoIpStatus, frontgateController } from "./frontgate.controller"
import { FrontgateErrorCodes } from "./Frontgate.types"

export const FrontgateSettings: React.FC = () => {
  const { t } = useTranslation()
  const dateTime = useDateTimeFormat()
  const [status, setStatus] = useState<GeoIpStatus | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [rollbackBusy, setRollbackBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    frontgateController
      .getGeoIpStatus()
      .then(setStatus)
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes) ??
            t("addon.frontgate.pages.settings.errors.loadFailed"),
        ),
      )
  }, [t])

  const handleUpload = async () => {
    if (!file) return
    setBusy(true)
    const formData = new FormData()
    formData.append("file", file)
    frontgateController
      .uploadGeoIp(formData, setProgress)
      .then((next) => {
        setStatus(next)
        setFile(null)
        setUploadKey((k) => k + 1)
        setProgress(null)

        if (fileRef.current) {
          fileRef.current.value = ""
        }

        nmxToast.success(
          t("addon.frontgate.pages.settings.feedback.uploadSuccess"),
        )
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes) ??
            t("addon.frontgate.pages.settings.errors.uploadFailed"),
        ),
      )
      .finally(() => {
        setBusy(false)
        setProgress(null)
      })
  }

  const handleRollback = () => {
    setRollbackBusy(true)
    frontgateController
      .rollbackGeoIp()
      .then((next) => {
        setStatus(next)
        setRollbackOpen(false)
        nmxToast.success(
          t("addon.frontgate.pages.settings.feedback.rollbackSuccess"),
        )
      })
      .catch((err) =>
        nmxToast.error(
          formatCustomError(t, err, FrontgateErrorCodes) ??
            t("addon.frontgate.pages.settings.errors.rollbackFailed"),
        ),
      )
      .finally(() => setRollbackBusy(false))
  }

  return (
    <div className="nmx-addon-frontgate__page nmx-addon-frontgate__page-settings">
      <NmxSettingsSection
        title={t("addon.frontgate.pages.settings.sections.geoIp")}
      >
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.frontgate.pages.settings.fields.exists")}
            description={t("addon.frontgate.pages.settings.fields.existsDesc")}
          >
            <NmxBadge semantic={status?.exists ? "success" : "error"} size="sm">
              {status?.exists
                ? t("addon.frontgate.pages.settings.statusValues.exists")
                : t("addon.frontgate.pages.settings.statusValues.missing")}
            </NmxBadge>
          </NmxSettingsRow>
          {status?.exists && (
            <>
              <NmxSettingsRow
                label={t("addon.frontgate.pages.settings.fields.databaseType")}
              >
                <span>{status.databaseType ?? "—"}</span>
              </NmxSettingsRow>
              <NmxSettingsRow
                label={t("addon.frontgate.pages.settings.fields.buildEpoch")}
              >
                <span>
                  {status.buildEpoch
                    ? dateTime.dateTime(status.buildEpoch)
                    : "—"}
                </span>
              </NmxSettingsRow>
              <NmxSettingsRow
                label={t("addon.frontgate.pages.settings.fields.fileSize")}
              >
                <span>{(status.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              </NmxSettingsRow>
            </>
          )}
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection shouldRender={status?.hasBackup === true}>
        <NmxButton
          semantic="warning"
          label={t("addon.frontgate.pages.settings.actions.rollback")}
          uppercase
          fullWidth
          disabled={busy || rollbackBusy}
          onClick={() => setRollbackOpen(true)}
        />
      </NmxSettingsSection>

      <NmxSettingsSection
        title={t("addon.frontgate.pages.settings.sections.upload")}
      >
        <NmxSettingsCard>
          <NmxSettingsRow
            label={t("addon.frontgate.pages.settings.fields.upload")}
            description={t("addon.frontgate.pages.settings.fields.uploadDesc")}
          >
            <NmxFileInput
              key={uploadKey}
              onFile={setFile}
              accept=".mmdb"
              progress={progress}
              placeholder="Select GeoLite2-Country.mmdb..."
            />
          </NmxSettingsRow>
        </NmxSettingsCard>
      </NmxSettingsSection>
      <NmxSettingsSection>
        <NmxButton
          onClick={handleUpload}
          disabled={busy || !file}
          label={t("addon.frontgate.pages.settings.actions.upload")}
          uppercase
          fullWidth
        />
      </NmxSettingsSection>

      <NmxAlertDialog
        open={rollbackOpen}
        title={t("addon.frontgate.pages.settings.rollbackDialog.title")}
        description={t(
          "addon.frontgate.pages.settings.rollbackDialog.description",
        )}
        confirmLabel={t(
          "addon.frontgate.pages.settings.rollbackDialog.confirm",
        )}
        cancelLabel={t("addon.frontgate.pages.settings.rollbackDialog.cancel")}
        confirmSemantic="warning"
        loading={rollbackBusy}
        onConfirm={handleRollback}
        onCancel={() => setRollbackOpen(false)}
      >
        <NmxMetaList>
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.currentVersion",
            )}
            value={status?.databaseType ?? "—"}
            alignValue="end"
          />
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.currentBuild",
            )}
            value={
              status?.buildEpoch ? dateTime.dateTime(status.buildEpoch) : "—"
            }
            alignValue="end"
          />
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.currentSize",
            )}
            value={
              status
                ? `${(status.fileSize / (1024 * 1024)).toFixed(1)} MB`
                : "—"
            }
            alignValue="end"
          />
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.backupVersion",
            )}
            value={status?.backupDatabaseType ?? "—"}
            alignValue="end"
          />
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.backupBuild",
            )}
            value={
              status?.backupBuildEpoch
                ? dateTime.dateTime(status.backupBuildEpoch)
                : "—"
            }
            alignValue="end"
          />
          <NmxMetaItem
            label={t(
              "addon.frontgate.pages.settings.rollbackDialog.backupSize",
            )}
            value={
              status?.backupFileSize != null
                ? `${(status.backupFileSize / (1024 * 1024)).toFixed(1)} MB`
                : "—"
            }
            alignValue="end"
          />
        </NmxMetaList>
      </NmxAlertDialog>
    </div>
  )
}
