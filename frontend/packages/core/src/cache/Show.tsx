import React from "react"

export function Show({
  when,
  children,
}: {
  when: boolean
  children: React.ReactNode
}) {
  return <div hidden={!when}>{children}</div>
}
