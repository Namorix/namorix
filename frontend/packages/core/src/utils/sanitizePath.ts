/**
 * Strips path traversal characters from a path segment.
 * Prevents directory traversal attacks (e.g. "../", "..\\").
 * Only allows safe alphanumeric, dash, underscore, and dot (single) characters.
 */
export function sanitizePathSegment(segment: string): string {
  return segment
    .replace(/\.\./g, "") // bỏ ..
    .replace(/\//g, "") // bỏ /
    .replace(/\\/g, "") // bỏ \
    .trim()
}
