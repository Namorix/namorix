export interface GuardPaths {
  home?: string
  login?: string
  register?: string
}

export type GuardFn = () => Promise<string | null>

export interface AuthChecker {
  isAuthenticated: () => Promise<boolean>
  checkHasUsers: () => Promise<boolean>
  isRegistrationOpen: () => Promise<boolean>
}

const defaultPaths: Required<GuardPaths> = {
  home: "/",
  login: "/login",
  register: "/register",
}

export function createAuthGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const p = { ...defaultPaths, ...paths }
  return async () => {
    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return p.register
    }

    if (!(await auth.isAuthenticated())) {
      return p.login
    }

    return null
  }
}

export function createLoginGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const p = { ...defaultPaths, ...paths }
  return async () => {
    if (await auth.isAuthenticated()) {
      return p.home
    }

    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return p.register
    }

    return null
  }
}

export function createRegisterGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const p = { ...defaultPaths, ...paths }
  return async () => {
    if (await auth.isAuthenticated()) {
      return p.home
    }

    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return null
    }

    if (!(await auth.isRegistrationOpen())) {
      return p.login
    }

    return null
  }
}
