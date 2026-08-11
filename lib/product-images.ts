// Presentation asset map: product slug → real stock photography (Unsplash CDN).
// Kept separate from mock-data so both the seed layer and UI components can
// import it without pulling in the whole mock store. When the real backend
// ships per-product imagery via the API, these become the fallback only.

// Each entry is a verified Unsplash photo id. We append sizing params at read
// time so callers can request square thumbnails or larger detail shots.
const PRODUCT_PHOTO_BY_SLUG: Record<string, string> = {
  "16oz-double-wall-paper-cup": "photo-1517701550927-30cf4ba1dba5",
  "stanley-style-20oz-tumbler": "photo-1544787219-7f47ccb76574",
  "kraft-takeaway-box-medium": "photo-1607349913338-fca6f7fc42d0",
  "pla-cold-cup-12oz": "photo-1570197788417-0e82375c9371",
  "bagasse-clamshell-9-inch": "photo-1584556812952-905ffd0c611a",
  "paper-shopping-bag-twist-handle": "photo-1591197172062-c718f82aba20",
  "pp-deli-container-32oz": "photo-1603052875302-d376b7c0638a",
  "8oz-espresso-paper-cup": "photo-1495474472287-4d71bcdd2085",
  "insulated-travel-mug-12oz": "photo-1523362628745-0c100150b504",
  "recycled-mailer-bag-small": "photo-1607083206968-13611e3d76db",
  "pla-straw-wrapped": "photo-1572119865084-43c285814d63",
  "kraft-soup-container-16oz": "photo-1541167760496-1628856ab772",
}

// Deterministic fallback so an unmapped slug still renders a real photo rather
// than a broken image. Uses a generic packaging-category Unsplash photo.
const fallback = (size: number) =>
  `https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=${size}&h=${size}&fit=crop&q=80`

// Returns a real product photo URL. `size` is the square edge in px; `detail`
// shifts the crop focus (entropy) so the gallery's second image looks distinct
// from the primary without needing a separate asset.
export function productImageUrl(
  slug: string,
  size = 600,
  detail = false
): string {
  const photo = PRODUCT_PHOTO_BY_SLUG[slug]
  if (!photo) return fallback(size)
  const crop = detail ? "&crop=entropy" : ""
  return `https://images.unsplash.com/${photo}?w=${size}&h=${size}&fit=crop&q=80${crop}`
}
