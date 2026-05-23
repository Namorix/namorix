import { createCssVariableCache } from "./cssVariableCache"

type BreakpointDefaults = {
  sm: number
  md: number
  lg: number
  xl: number
}

const BREAKPOINT_DEFAULTS = {
  sm: ["--nmx-breakpoint-sm", 480],
  md: ["--nmx-breakpoint-md", 640],
  lg: ["--nmx-breakpoint-lg", 800],
  xl: ["--nmx-breakpoint-xl", 1024],
} as const satisfies Record<keyof BreakpointDefaults, [string, number]>

const breakpointCache =
  createCssVariableCache<BreakpointDefaults>(BREAKPOINT_DEFAULTS)

export const getBreakpointDefaults = () => breakpointCache.get()
export const invalidateBreakpointDefaults = () => breakpointCache.invalidate()
