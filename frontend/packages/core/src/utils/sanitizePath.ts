/**
 * Strips path traversal characters from a path segment.
 * Prevents directory traversal attacks (e.g. "../", "..\\").
 * Only allows safe alphanumeric, dash, underscore, and dot (single) characters.
 */
export function sanitizePath(path: string): string {
  return path.split("/").map(sanitizePathSegment).filter(Boolean).join("/")
}

export function sanitizePathSegment(segment: string): string {
  let prev: string
  let result = segment.trim()

  do {
    prev = result
    result = result.replace(/\.\./g, "").replace(/\//g, "").replace(/\\/g, "")
  } while (result !== prev)

  return result
}
