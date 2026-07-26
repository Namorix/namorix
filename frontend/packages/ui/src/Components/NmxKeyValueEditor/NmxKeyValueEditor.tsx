// NmxKeyValueEditor.tsx

import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import {
  NmxButton,
  NmxFormInput,
  NmxFormRow,
  NmxIconFont,
  NmxIconFontSymbol,
} from "../../Primitives"

export interface NmxKeyValuePair {
  key: string
  value: string
}

interface NmxKeyValueEditorProps extends WithBaseProps {
  values: NmxKeyValuePair[]
  onChange: (values: NmxKeyValuePair[]) => void
  keyLabel?: string
  valueLabel?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  buttonDeleteClass?: string
}

export const NmxKeyValueEditor: React.FC<NmxKeyValueEditorProps> = ({
  values,
  onChange,
  keyLabel = "Name",
  valueLabel = "Value",
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  buttonDeleteClass,
  className,
}) => {
  const update = (idx: number, field: "key" | "value", val: string) =>
    onChange(
      values.map((item, i) => (i === idx ? { ...item, [field]: val } : item)),
    )

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx))

  return (
    <div className={cx("nmx-key-value-editor", className)}>
      <div className="nmx-key-value-editor__header">
        <span className="nmx-key-value-editor__header-label">{keyLabel}</span>
        <span className="nmx-key-value-editor__header-label">{valueLabel}</span>
        <span className="nmx-key-value-editor__header-spacer" />
      </div>

      {values.map((item, idx) => (
        <NmxFormRow key={idx} className="nmx-key-value-editor__row">
          <NmxFormInput
            value={item.key}
            onValueChange={(v) => update(idx, "key", v)}
            placeholder={keyPlaceholder}
          />
          <NmxFormInput
            value={item.value}
            onValueChange={(v) => update(idx, "value", v)}
            placeholder={valuePlaceholder}
          />
          <NmxButton
            variant="ghost"
            semantic="error"
            onClick={() => remove(idx)}
            className={buttonDeleteClass}
          >
            <NmxIconFont symbol={NmxIconFontSymbol.DELETE} />
          </NmxButton>
        </NmxFormRow>
      ))}
    </div>
  )
}
