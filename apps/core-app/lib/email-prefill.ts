export type EmailPrefillValue = string | string[] | null | undefined;

export function readEmailPrefill(rawValue?: EmailPrefillValue) {
  if (!rawValue) {
    return "";
  }

  const normalized = Array.isArray(rawValue) ? rawValue[0]?.trim() : rawValue.trim();

  if (!normalized) {
    return "";
  }

  return normalized.slice(0, 255);
}

export function buildSafeEmailPrefillPath(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
) {
  const email = readEmailPrefill(searchParams.email);
  const definedKeys = Object.entries(searchParams).filter(
    ([, value]) => value !== undefined,
  );
  const shouldStripQuery =
    definedKeys.some(([key]) => key !== "email") ||
    Boolean(Array.isArray(searchParams.email)) ||
    (typeof searchParams.email === "string" && searchParams.email.trim() !== email) ||
    (definedKeys.length > 0 && email.length === 0);

  if (!shouldStripQuery) {
    return null;
  }

  const nextSearch = email ? `?email=${encodeURIComponent(email)}` : "";

  return `${pathname}${nextSearch}`;
}
