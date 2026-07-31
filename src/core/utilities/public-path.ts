const PUBLIC_BASE_URL =
  import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

function isExternalUrl(
  path: string,
): boolean {
  return (
    /^(?:[a-z]+:)?\/\//i.test(path) ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  )
}

export function resolvePublicPath(
  path: string,
): string {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    return PUBLIC_BASE_URL
  }

  if (isExternalUrl(trimmedPath)) {
    return trimmedPath
  }

  const normalizedPath =
    trimmedPath.replace(/^\/+/, '')

  return `${PUBLIC_BASE_URL}${normalizedPath}`
}