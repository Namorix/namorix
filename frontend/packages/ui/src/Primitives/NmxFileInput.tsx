import React, { useRef, useState } from "react"
import { cx } from "../utils"
import type { WithBaseProps } from "../types"
import { NmxIconFont, NmxIconFontSymbol } from "./NmxIcon"
import { NmxButton } from "./NmxButton"

interface NmxFileInputProps extends WithBaseProps {
  value?: string
  onValueChange?: (value: string) => void
  accept?: string
  placeholder?: string
  disabled?: boolean
}

export const NmxFileInput: React.FC<NmxFileInputProps> = ({
  value,
  onValueChange,
  accept = "*/*",
  placeholder = "No file selected",
  disabled = false,
  shouldRender = true,
  className,
}) => {
  const [filename, setFilename] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      onValueChange?.(text.replace(/^\uFEFF/, "").trim())
    }
    reader.readAsText(file)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFilename(null)
    onValueChange?.("")
    if (fileRef.current) fileRef.current.value = ""
  }

  if (!shouldRender) return null

  const hasValue = !!value || !!filename

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
        className="nmx-file-input__area"
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
                {`(${(value!.length / 1024).toFixed(1)} KB)`}
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
            <span className="nmx-file-input__filename">{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  )
}
