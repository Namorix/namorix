import React, { useRef, useState } from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"
import { NmxButton } from "./NmxButton"

interface NmxFileInputProps extends WithBaseProps {
  value?: string
  onValueChange?: (value: string) => void
  onFile?: (file: File | null) => void
  accept?: string
  placeholder?: string
  disabled?: boolean
  progress?: number | null
}

export const NmxFileInput: React.FC<NmxFileInputProps> = ({
  value,
  onValueChange,
  onFile,
  accept = "*/*",
  placeholder = "No file selected",
  disabled = false,
  progress,
  shouldRender = true,
  className,
}) => {
  const [filename, setFilename] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    setFileSize(file.size)
    onFile?.(file)
    if (onValueChange) {
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        onValueChange(text.replace(/^\uFEFF/, "").trim())
      }
      reader.readAsText(file)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFilename(null)
    setFileSize(null)
    onValueChange?.("")
    onFile?.(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  if (!shouldRender) return null

  const hasValue = !!value || !!filename
  const sizeBytes = fileSize ?? value?.length ?? 0
  const isUploading = typeof progress === "number" && progress < 100

  return (
    <div className={cx("nmx-file-input", className)}>
      <input
        ref={fileRef}
        type="file"
        {...(accept && accept !== "*/*" ? { accept } : {})}
        onChange={handleFile}
        disabled={disabled}
        className="nmx-file-input__native"
      />

      <div
        className={cx("nmx-file-input__area", {
          "nmx-file-input__area--uploading": isUploading,
        })}
        style={
          typeof progress === "number"
            ? ({
                "--nmx-file-input-progress": `${progress}%`,
              } as React.CSSProperties)
            : undefined
        }
        onClick={() => fileRef.current?.click()}
      >
        {hasValue ? (
          <>
            <div className="nmx-file-input__info">
              <NmxIconFont
                symbol={NmxIconFontSymbol.FILE_LINK}
                className="nmx-file-input__icon"
              />
              <span className="nmx-file-input__filename">
                {filename ?? "Loaded"}
              </span>
              <span className="nmx-file-input__size">
                {`(${(sizeBytes / 1024).toFixed(1)} KB)`}
              </span>
            </div>
            <NmxButton
              variant="ghost"
              semantic="error"
              onClick={handleClear}
              disabled={disabled}
              className="nmx-file-input__clear"
            >
              <NmxIconFont
                symbol={NmxIconFontSymbol.CLOSE}
                className="nmx-file-input__clear-icon"
              />
            </NmxButton>
          </>
        ) : (
          <div className="nmx-file-input__info">
            <NmxIconFont
              symbol={NmxIconFontSymbol.UPLOAD}
              className="nmx-file-input__icon"
            />
            <span className="nmx-file-input__filename nmx-file-input__placeholder">
              {placeholder}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
