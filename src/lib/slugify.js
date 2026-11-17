// Unicode-aware slug: keeps letters (incl. Bangla), combining marks and numbers.
// Mirrors normalizeSlug() in dashboard-server/utils/blogHelpers.js.
//
// final=false is used while typing, so a trailing "-" is not removed
// before the user types the next word.
export function slugify(value = "", { final = true } = {}) {
  const slug = value
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/g, "-");

  return final ? slug.replace(/^-+|-+$/g, "") : slug.replace(/^-+/, "");
}
