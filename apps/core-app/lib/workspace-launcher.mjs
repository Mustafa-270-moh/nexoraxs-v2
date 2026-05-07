export function resolveSelectedWorkspaceSlug(workspaces, preferredSlug) {
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return null;
  }

  if (preferredSlug) {
    const preferredWorkspace = workspaces.find(
      (workspace) => workspace.slug === preferredSlug,
    );

    if (preferredWorkspace) {
      return preferredWorkspace.slug;
    }
  }

  return workspaces[0].slug;
}

export function resolveShopsAppBaseUrl(configuredBaseUrl, currentHostname) {
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
    return "http://localhost:3001";
  }

  return "https://shops.nexoraxs.com";
}

export function buildWorkspaceAppUrl(baseUrl, workspaceSlug) {
  const normalizedBaseUrl = String(baseUrl ?? "").replace(/\/+$/, "");
  const normalizedWorkspaceSlug = String(workspaceSlug ?? "").trim();

  if (!normalizedBaseUrl) {
    throw new Error("App base URL is required.");
  }

  if (!normalizedWorkspaceSlug) {
    throw new Error("Workspace slug is required.");
  }

  return `${normalizedBaseUrl}/w/${encodeURIComponent(normalizedWorkspaceSlug)}`;
}
