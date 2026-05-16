import { DEV } from "../env/development"

/**
 * Wraps any async function so that concurrent calls share the same promise.
 * Subsequent calls while the first is pending return the same promise
 * instead of creating a new one — preventing double requests in React StrictMode.
 *
 * Only active in development mode — in production, returns the original function as-is.
 * Production: DEV=false via package.json conditional export ("./env").
 * "development" → development.ts (DEV=true), "default" → production.ts (DEV=false).
 * Vite resolves based on mode — no import.meta.env needed.
 */

// TODO: verify tree-shaking works correctly in production build
export function dedupe<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  if (!DEV) {
    return fn
  }

  const pending = new Map<string, Promise<R>>()
  return (...args: T): Promise<R> => {
    const key = args.length === 0 ? "__none__" : JSON.stringify(args)
    if (!pending.has(key)) {
      const promise = fn(...args).finally(() => pending.delete(key))
      pending.set(key, promise)
    }

    return pending.get(key)!
  }
}
