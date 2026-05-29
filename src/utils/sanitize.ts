const JS_PROTO_RE = /^\s*javascript\s*:/i

export function sanitizeHref(href: string): string {
  if (JS_PROTO_RE.test(href)) {
    return "#"
  }
  return href
}
