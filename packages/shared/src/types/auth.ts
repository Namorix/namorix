import type { User } from "./user"

export interface AuthStatus {
  needsRegister: boolean
  registerEnabled: boolean
}

export interface AuthResult {
  user: User
  accessToken: string
  refreshToken: string
}
