import type { WithBaseProps, WithMuted, WithSemanticColor } from "../../types"
import { cx, cxMuted, cxSemantic } from "../../utils"

interface NmxMetaItemProps extends WithBaseProps, WithSemanticColor, WithMuted {
  label?: string
  value?: string
}

export const NmxMetaItem: React.FC<NmxMetaItemProps> = ({
  label,
  value,
  semantic,
  muted,
  shouldRender = true,
  className,
  ...rest
}) => {
  if (!shouldRender) {
    return
  }

  return (
    <div {...rest} className={cx("nmx-meta-list__item", className)}>
      {label && <span className="nmx-meta-list__item-label">{label}</span>}
      {value && (
        <span
          className={cx(
            "nmx-meta-list__item-value",
            cxSemantic(
              "nmx-meta-list__item-value",
              !muted ? semantic : undefined,
            ),
            cxMuted("nmx-meta-list__item-value", muted),
          )}
        >
          {value}
        </span>
      )}
    </div>
  )
}
