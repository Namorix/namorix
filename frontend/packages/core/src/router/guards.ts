import { dedupe } from "../utils"

export interface GuardPaths {
  HOME?: string
  LOGIN?: string
  REGISTER?: string
}

export type GuardFn = () => Promise<string | null>

export interface AuthChecker {
  isAuthenticated: () => Promise<boolean>
  checkHasUsers: () => Promise<boolean>
  isRegistrationOpen: () => Promise<boolean>
}

export const DefaultPaths: Required<GuardPaths> = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
} as const

export type DefaultPaths = (typeof DefaultPaths)[keyof typeof DefaultPaths]

/**
 * Deduplicates concurrent calls to a guard function.
 * While a guard is pending, subsequent calls return the same promise
 * instead of creating a new one — preventing double requests in React StrictMode.
 */
function dedupeGuard(guard: GuardFn): GuardFn {
  return dedupe(guard)
}

export function createAuthGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return dedupeGuard(async () => {
    const hasUsers = await auth.checkHasUsers()

    if (!hasUsers) {
      return path.REGISTER
    }

    if (!(await auth.isAuthenticated())) {
      return path.LOGIN
    }

    return null
  })
}

export function createLoginGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return dedupeGuard(async () => {
    if (await auth.isAuthenticated()) {
      return path.HOME
    }

    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return path.REGISTER
    }

    return null
  })
}

export function createRegisterGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return dedupeGuard(async () => {
    if (await auth.isAuthenticated()) {
      return path.HOME
    }

    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return null
    }

    if (!(await auth.isRegistrationOpen())) {
      return path.LOGIN
    }

    return null
  })
}
