export function resolveCoreAppBaseUrl(configuredBaseUrl, currentHostname) {
  const normalizedConfiguredBaseUrl = String(configuredBaseUrl ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (normalizedConfiguredBaseUrl) {
    return normalizedConfiguredBaseUrl;
  }

  const normalizedHostname = String(currentHostname ?? "").trim().toLowerCase();

  if (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1"
  ) {
    return "http://localhost:3000";
  }

  return "https://app.nexoraxs.com";
}
