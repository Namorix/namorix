import type { WithBaseProps } from "../../types"
import { cx } from "../../utils"
import { NmxTabProvider } from "../NmxTabProvider"

export interface NmxToolbarProps<
  T extends string = string,
> extends WithBaseProps {
  defaultTab?: T
  onTabChange?: (tab: T) => void
}

export const NmxToolbar = <T extends string = string>({
  defaultTab,
  onTabChange,
  shouldRender = true,
  className,
  children,
  ...rest
}: NmxToolbarProps<T>) => {
  if (!shouldRender) return null

  const content = (
    <div {...rest} className={cx("nmx-toolbar", className)}>
      {children}
    </div>
  )

  if (defaultTab !== undefined) {
    return (
      <NmxTabProvider
        defaultTab={defaultTab}
        onTabChange={onTabChange as ((tab: string) => void) | undefined}
      >
        {content}
      </NmxTabProvider>
    )
  }

  return content
}
