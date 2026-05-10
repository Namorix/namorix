export interface GuardPaths {
  home?: string
  signin?: string
  signup?: string
}

export type GuardFn = () => Promise<string | null>

export interface AuthChecker {
  isAuthenticated: () => Promise<boolean>
  checkHasUsers: () => Promise<boolean>
  isRegistrationOpen: () => Promise<boolean>
}

const defaultPaths: Required<GuardPaths> = {
  home: "/",
  signin: "/signin",
  signup: "/signup",
}

export function createAuthGuard(
  auth: AuthChecker,
  paths?: GuardPaths,
): GuardFn {
  const p = { ...defaultPaths, ...paths }
  return async () => {
    const hasUsers = await auth.checkHasUsers()
    if (!hasUsers) {
      return p.signup
    }

    if (!(await auth.isAuthenticated())) {
      return p.signin
    }

    return null
  }
}

export function createSignInGuard(
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
      return p.signup
    }

    return null
  }
}

export function createSignUpGuard(
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
      return p.signin
    }

    return null
  }
}
