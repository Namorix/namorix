import { useUserStore, UserRole } from "@namorix/core"

export const useUserRoleAdmin = (): boolean => {
  const user = useUserStore()
  return user?.role === UserRole.Admin
}
