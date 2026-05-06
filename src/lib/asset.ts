// Prepend the GH Pages basePath (set via NEXT_PUBLIC_BASE_PATH) to a public asset.
// Use for raw <img src>, fetch(), CSS url() etc. — Next's <Image> and <Link>
// already apply basePath on their own.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string): string {
  if (!path.startsWith("/")) return `${BASE}/${path}`;
  return `${BASE}${path}`;
}
