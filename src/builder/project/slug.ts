const COMPLETE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const CANONICAL_NON_HOME_SLUG_PATTERN = /^\/[a-z\d]+(?:-[a-z\d]+)*$/;

export function normalizeExplicitPageSlug(input: string): string | null {
  const trimmed = input.trim();

  if (
    trimmed === "" ||
    COMPLETE_URL_PATTERN.test(trimmed) ||
    trimmed.includes("?") ||
    trimmed.includes("#")
  ) {
    return null;
  }

  const segment = trimmed
    .replace(/^\/+|\/+$/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return segment === "" ? null : `/${segment}`;
}

export function isCanonicalNonHomeSlug(slug: string): boolean {
  return CANONICAL_NON_HOME_SLUG_PATTERN.test(slug);
}

export function createGeneratedPageSlug(
  name: string,
  existingSlugs: ReadonlySet<string>,
): string {
  const base = normalizeExplicitPageSlug(name) ?? "/page";

  if (!existingSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;

  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
