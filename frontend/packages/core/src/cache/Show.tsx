import React from "react"

export function Show({
  when,
  children,
}: {
  when: boolean
  children: React.ReactNode
}) {
  return <div style={{ display: when ? "contents" : "none" }}>{children}</div>
}
