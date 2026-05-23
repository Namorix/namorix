export function createCssVariableCache<
  T extends Record<string, number>,
>(definitions: { [K in keyof T]: [string, number] }) {
  let cache: T | null = null

  return {
    get(): T {
      if (cache) return cache

      const cs = getComputedStyle(document.documentElement)
      cache = Object.fromEntries(
        Object.entries(definitions).map(([key, [prop, fallback]]) => [
          key,
          parseFloat(cs.getPropertyValue(prop)) || fallback,
        ]),
      ) as T

      return cache
    },
    invalidate() {
      cache = null
    },
  }
}
