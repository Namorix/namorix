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

export function createAuthGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return async () => {
    const hasUsers = await auth.checkHasUsers()

    if (!hasUsers) {
      return path.REGISTER
    }

    if (!(await auth.isAuthenticated())) {
      return path.LOGIN
    }

    return null
  }
}

export function createLoginGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return async () => {
    if (await auth.isAuthenticated()) {
      return path.HOME
    }

    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return path.REGISTER
    }

    return null
  }
}

export function createRegisterGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const path = { ...DefaultPaths, ...paths }
  return async () => {
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
  }
}
