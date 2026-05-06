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
