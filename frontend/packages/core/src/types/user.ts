export const UserRole = {
  User: 0,
  Admin: 1,
} as const

export interface User {
  id: number
  username: string
  role: UserRole
}

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
