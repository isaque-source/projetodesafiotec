/**
 * Resolves the absolute backend API URL when hosted on modern frontend-only servers like Vercel.
 * If VITE_API_BASE_URL is defined, it prefixes the path with that URL, otherwise it falls back to a relative path.
 */
export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  if (baseUrl) {
    const formattedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const formattedPath = path.startsWith("/") ? path : `/${path}`;
    return `${formattedBase}${formattedPath}`;
  }
  return path;
}
