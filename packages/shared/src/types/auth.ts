import type { User } from "./user"

export interface AuthStatus {
  needsSignup: boolean
  signUpEnabled: boolean
}

export interface AuthResult {
  user: User
  accessToken: string
  refreshToken: string
}
