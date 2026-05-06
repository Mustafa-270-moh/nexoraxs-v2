import { ShopsWorkspaceShell } from "@/components/shops-workspace-shell";

type ShopsWorkspacePageProps = {
  params: Promise<{
    workspaceSlug: string;
  }>;
};

export default async function ShopsWorkspacePage({
  params,
}: ShopsWorkspacePageProps) {
  const { workspaceSlug } = await params;

  return <ShopsWorkspaceShell workspaceSlug={workspaceSlug} />;
}
