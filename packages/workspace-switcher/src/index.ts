export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type WorkspaceSummary = {
  id: string;
  accountId: string;
  name: string;
  slug: string;
  role: WorkspaceRole | null;
};

export type WorkspaceOption = {
  value: string;
  label: string;
  hint: string;
};

export function resolveInitialWorkspaceSlug(
  workspaces: WorkspaceSummary[],
  preferredSlug?: string | null,
) {
  if (preferredSlug) {
    const preferredWorkspace = workspaces.find(
      (workspace) => workspace.slug === preferredSlug,
    );

    if (preferredWorkspace) {
      return preferredWorkspace.slug;
    }
  }

  return workspaces[0]?.slug ?? null;
}

export function toWorkspaceOption(workspace: WorkspaceSummary): WorkspaceOption {
  return {
    value: workspace.slug,
    label: workspace.name,
    hint: workspace.role ?? "member",
  };
}
