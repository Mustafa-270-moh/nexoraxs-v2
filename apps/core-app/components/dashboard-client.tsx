"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ApiClientError,
  type AuthUser,
  type Workspace,
  type WorkspaceApp,
  createWorkspace,
  getCurrentUser,
  getWorkspaceApps,
  getWorkspaces,
  logout,
  subscribeToShops,
} from "@/lib/auth-api";
import {
  buildWorkspaceAppUrl,
  resolveShopsAppBaseUrl,
  resolveSelectedWorkspaceSlug,
} from "@/lib/workspace-launcher.mjs";

type WorkspaceFormState = {
  name: string;
  slug: string;
};

type DashboardBootstrapData = {
  user: AuthUser;
  workspaces: Workspace[];
};

type WorkspaceAppsBootstrapData = {
  workspace: Workspace;
  apps: WorkspaceApp[];
};

let pendingDashboardBootstrap: Promise<DashboardBootstrapData> | null = null;
const pendingWorkspaceAppsBootstrap = new Map<
  string,
  Promise<WorkspaceAppsBootstrapData>
>();

function normalizeWorkspaceSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function shopsAppBaseUrl() {
  return resolveShopsAppBaseUrl(
    process.env.NEXT_PUBLIC_SHOPS_APP_BASE,
    typeof window === "undefined" ? undefined : window.location.hostname,
  );
}

function loadDashboardBootstrap() {
  if (!pendingDashboardBootstrap) {
    // Share the in-flight bootstrap during hydration so dev Strict Mode
    // remounts do not issue duplicate auth and workspace requests.
    pendingDashboardBootstrap = Promise.all([
      getCurrentUser(),
      getWorkspaces(),
    ])
      .then(([userResponse, workspacesResponse]) => ({
        user: userResponse.data.user,
        workspaces: workspacesResponse.data,
      }))
      .finally(() => {
        pendingDashboardBootstrap = null;
      });
  }

  return pendingDashboardBootstrap;
}

function loadWorkspaceAppsBootstrap(workspaceSlug: string) {
  if (!pendingWorkspaceAppsBootstrap.has(workspaceSlug)) {
    pendingWorkspaceAppsBootstrap.set(
      workspaceSlug,
      getWorkspaceApps(workspaceSlug)
        .then((response) => response.data)
        .finally(() => {
          pendingWorkspaceAppsBootstrap.delete(workspaceSlug);
        }),
    );
  }

  return pendingWorkspaceAppsBootstrap.get(workspaceSlug)!;
}

export function DashboardClient() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceSlug, setSelectedWorkspaceSlug] = useState<
    string | null
  >(null);
  const [selectedWorkspaceApps, setSelectedWorkspaceApps] = useState<
    WorkspaceApp[]
  >([]);
  const [launcherWorkspace, setLauncherWorkspace] = useState<Workspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [launcherError, setLauncherError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshingWorkspaces, setIsRefreshingWorkspaces] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [openingAppCode, setOpeningAppCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormState>({
    name: "",
    slug: "",
  });
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  const selectedWorkspace =
    workspaces.find((workspace) => workspace.slug === selectedWorkspaceSlug) ??
    null;
  const selectedWorkspaceRole =
    launcherWorkspace?.role ?? selectedWorkspace?.role ?? null;
  const selectedWorkspaceAppsData = selectedWorkspaceSlug
    ? selectedWorkspaceApps
    : [];
  const launcherErrorMessage = selectedWorkspaceSlug ? launcherError : null;

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setDashboardError(null);

      try {
        const dashboardData = await loadDashboardBootstrap();

        if (!isActive) {
          return;
        }

        setUser(dashboardData.user);
        setWorkspaces(dashboardData.workspaces);
        setSelectedWorkspaceSlug((current) =>
          resolveSelectedWorkspaceSlug(dashboardData.workspaces, current),
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setUser(null);
        setWorkspaces([]);
        setSelectedWorkspaceSlug(null);
        setDashboardError(
          error instanceof ApiClientError
            ? error.message
            : "Unexpected frontend error while loading the dashboard foundation.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [attempt, router]);

  useEffect(() => {
    const workspaceSlug = selectedWorkspaceSlug;

    if (!workspaceSlug) {
      return;
    }

    let isActive = true;

    async function loadWorkspaceApps() {
      setIsLoadingApps(true);
      setLauncherError(null);

      try {
        const data = await loadWorkspaceAppsBootstrap(workspaceSlug!);

        if (!isActive) {
          return;
        }

        setLauncherWorkspace(data.workspace);
        setSelectedWorkspaceApps(data.apps);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setLauncherWorkspace(null);
        setSelectedWorkspaceApps([]);
        setLauncherError(
          error instanceof ApiClientError
            ? error.message
            : "Unexpected frontend error while loading the app launcher.",
        );
      } finally {
        if (isActive) {
          setIsLoadingApps(false);
        }
      }
    }

    void loadWorkspaceApps();

    return () => {
      isActive = false;
    };
  }, [selectedWorkspaceSlug, router]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      setDashboardError(
        error instanceof ApiClientError
          ? error.message
          : "Unexpected frontend error while trying to sign out.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function refreshWorkspaceList(preferredSlug?: string) {
    if (isRefreshingWorkspaces) {
      return;
    }

    setIsRefreshingWorkspaces(true);
    setDashboardError(null);

    try {
      const response = await getWorkspaces();
      setWorkspaces(response.data);
      setSelectedWorkspaceSlug((current) =>
        resolveSelectedWorkspaceSlug(
          response.data,
          preferredSlug ?? current ?? undefined,
        ),
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setDashboardError(
        error instanceof ApiClientError
          ? error.message
          : "Unexpected frontend error while refreshing workspaces.",
      );
    } finally {
      setIsRefreshingWorkspaces(false);
    }
  }

  async function refreshWorkspaceApps(workspaceSlug: string) {
    setIsLoadingApps(true);
    setLauncherError(null);

    try {
      const response = await getWorkspaceApps(workspaceSlug);
      setLauncherWorkspace(response.data.workspace);
      setSelectedWorkspaceApps(response.data.apps);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setLauncherError(
        error instanceof ApiClientError
          ? error.message
          : "Unexpected frontend error while refreshing the app launcher.",
      );
    } finally {
      setIsLoadingApps(false);
    }
  }

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreatingWorkspace) {
      return;
    }

    setIsCreatingWorkspace(true);
    setCreateError(null);
    setCreateFieldErrors({});

    try {
      const response = await createWorkspace(workspaceForm);
      const createdWorkspaceSlug = response.data.workspace.slug;

      setWorkspaceForm({ name: "", slug: "" });
      setSlugWasEdited(false);
      setSelectedWorkspaceSlug(createdWorkspaceSlug);
      await refreshWorkspaceList(createdWorkspaceSlug);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }

      if (error instanceof ApiClientError) {
        setCreateError(error.message);
        setCreateFieldErrors(error.errors);
      } else {
        setCreateError(
          "Unexpected frontend error while trying to create the workspace.",
        );
      }
    } finally {
      setIsCreatingWorkspace(false);
    }
  }

  async function handleOpenShops(app: WorkspaceApp) {
    if (!selectedWorkspaceSlug || openingAppCode) {
      return;
    }

    setOpeningAppCode(app.code);
    setLauncherError(null);

    try {
      if (!app.has_access) {
        await subscribeToShops(selectedWorkspaceSlug);
        await refreshWorkspaceApps(selectedWorkspaceSlug);
      }

      window.location.assign(
        buildWorkspaceAppUrl(shopsAppBaseUrl(), selectedWorkspaceSlug),
      );
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        router.replace("/login");
        return;
      }

      setLauncherError(
        error instanceof ApiClientError
          ? error.message
          : "Unexpected frontend error while opening the Shops app.",
      );
      setOpeningAppCode(null);
    }
  }

  function handleWorkspaceNameChange(value: string) {
    setWorkspaceForm((current) => ({
      ...current,
      name: value,
      slug: slugWasEdited ? current.slug : normalizeWorkspaceSlug(value),
    }));
  }

  function handleWorkspaceSlugChange(value: string) {
    setSlugWasEdited(true);
    setWorkspaceForm((current) => ({
      ...current,
      slug: normalizeWorkspaceSlug(value),
    }));
  }

  return (
    <main className="screen-shell">
      <section className="dashboard-shell">
        <article className="dashboard-card">
          <header className="dashboard-hero">
            <div>
              <p className="eyebrow">Platform shell only</p>
              <h1 className="dashboard-title">Core dashboard shell</h1>
              <p className="muted">
                Core App owns authentication, workspace selection, and the app
                launcher. It does not own any shop or business management
                modules.
              </p>
            </div>

            {user ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            ) : null}
          </header>

          {isLoading ? (
            <div className="status-panel info">
              <p className="status-title">Loading dashboard foundation</p>
              <p className="status-copy">
                Confirming the Sanctum session, then loading the current user
                {"'"}s
                workspaces.
              </p>
            </div>
          ) : null}

          {dashboardError ? (
            <div className="status-panel error">
              <p className="status-title">Unable to load dashboard</p>
              <p className="status-copy">{dashboardError}</p>
              <div className="button-row" style={{ marginTop: 12 }}>
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => setAttempt((current) => current + 1)}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {!isLoading && user ? (
            <>
              <div className="dashboard-grid">
                <section className="dashboard-tile">
                  <p className="dashboard-tile-label">Authenticated user</p>
                  <p className="dashboard-tile-value">{user.name}</p>
                </section>
                <section className="dashboard-tile">
                  <p className="dashboard-tile-label">Email</p>
                  <p className="dashboard-tile-value">{user.email}</p>
                </section>
                <section className="dashboard-tile">
                  <p className="dashboard-tile-label">Workspace count</p>
                  <p className="dashboard-tile-value">{workspaces.length}</p>
                </section>
                <section className="dashboard-tile">
                  <p className="dashboard-tile-label">Current phase</p>
                  <p className="dashboard-tile-value">
                    Launcher + Shops placeholder
                  </p>
                </section>
              </div>

              {workspaces.length === 0 ? (
                <section className="dashboard-section">
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">First workspace</p>
                      <h2 className="section-title">Create your first workspace</h2>
                      <p className="muted">
                        The backend will safely create an owning account if this
                        is the current user{"'"}s first workspace.
                      </p>
                    </div>
                  </div>

                  <div className="empty-state">
                    <p className="dashboard-meta">
                      No workspaces found yet. This phase covers workspace
                      creation, workspace selection, and the platform app
                      launcher only.
                    </p>
                  </div>

                  <WorkspaceCreateForm
                    values={workspaceForm}
                    fieldErrors={createFieldErrors}
                    errorMessage={createError}
                    isSubmitting={isCreatingWorkspace}
                    onNameChange={handleWorkspaceNameChange}
                    onSlugChange={handleWorkspaceSlugChange}
                    onSubmit={handleCreateWorkspace}
                    ids={{
                      name: "workspace-name",
                      slug: "workspace-slug",
                    }}
                    submitLabel="Create workspace"
                    submittingLabel="Creating workspace..."
                    helperText="Lowercase letters, numbers, and dashes only."
                  />
                </section>
              ) : (
                <>
                  <section className="dashboard-section">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Workspace selection</p>
                        <h2 className="section-title">Choose a workspace</h2>
                        <p className="muted">
                          The selected workspace drives the app launcher and the
                          future cross-app route shape.
                        </p>
                      </div>

                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => void refreshWorkspaceList()}
                        disabled={isRefreshingWorkspaces}
                      >
                        {isRefreshingWorkspaces
                          ? "Refreshing..."
                          : "Refresh workspaces"}
                      </button>
                    </div>

                    <div className="workspace-list">
                      {workspaces.map((workspace) => {
                        const isSelected =
                          workspace.slug === selectedWorkspaceSlug;

                        return (
                          <article className="workspace-item" key={workspace.id}>
                            <div>
                              <p className="workspace-name">{workspace.name}</p>
                              <p className="workspace-slug">/w/{workspace.slug}</p>
                            </div>
                            <div className="workspace-meta-group">
                              <span className="workspace-role">
                                Role: {workspace.role ?? "member"}
                              </span>
                              <span className="workspace-meta">
                                Account: {workspace.account_id}
                              </span>
                              <button
                                className={
                                  isSelected
                                    ? "button-secondary button-selected"
                                    : "button-secondary"
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedWorkspaceSlug(workspace.slug)
                                }
                              >
                                {isSelected ? "Selected" : "Use workspace"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="dashboard-section">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">App launcher</p>
                        <h2 className="section-title">Open a platform app</h2>
                        <p className="muted">
                          Core App launches products. Shops App owns the future
                          commerce modules themselves.
                        </p>
                      </div>

                      {selectedWorkspace ? (
                        <div className="workspace-chip">
                          Workspace: {selectedWorkspace.name}
                        </div>
                      ) : null}
                    </div>

                    {launcherErrorMessage ? (
                      <div className="status-panel error">
                        <p className="status-title">App launcher error</p>
                        <p className="status-copy">{launcherErrorMessage}</p>
                      </div>
                    ) : null}

                    {isLoadingApps ? (
                      <div className="status-panel info">
                        <p className="status-title">Loading apps</p>
                        <p className="status-copy">
                          Reading app access for the selected workspace.
                        </p>
                      </div>
                    ) : null}

                    {!isLoadingApps && selectedWorkspaceSlug ? (
                      <div className="app-launcher-grid">
                        {selectedWorkspaceAppsData.map((app) => {
                          const canAutoEnable =
                            app.code === "shops" &&
                            !app.has_access &&
                            selectedWorkspaceRole === "owner";
                          const openLabel = app.has_access
                            ? "Open Shops"
                            : canAutoEnable
                              ? "Enable and open Shops"
                              : "Shops not enabled";

                          return (
                            <article className="app-card" key={app.code}>
                              <div className="app-card-header">
                                <div>
                                  <p className="app-card-label">Platform app</p>
                                  <h3 className="app-card-title">{app.name}</h3>
                                </div>
                                <span
                                  className={
                                    app.has_access
                                      ? "app-badge active"
                                      : "app-badge pending"
                                  }
                                >
                                  {app.has_access ? "Active" : "Pending"}
                                </span>
                              </div>

                              <p className="app-card-copy">
                                This launcher only opens the Shops product
                                shell. No business modules live inside
                                `core-app`.
                              </p>

                              <dl className="app-card-meta">
                                <div>
                                  <dt>Subscription</dt>
                                  <dd>{app.subscription_status}</dd>
                                </div>
                                <div>
                                  <dt>Plan</dt>
                                  <dd>{app.plan_code ?? "starter"}</dd>
                                </div>
                                <div>
                                  <dt>Workspace role</dt>
                                  <dd>{selectedWorkspaceRole ?? "member"}</dd>
                                </div>
                              </dl>

                              <div className="button-row">
                                <button
                                  className="button"
                                  type="button"
                                  onClick={() => void handleOpenShops(app)}
                                  disabled={
                                    openingAppCode === app.code ||
                                    (!app.has_access && !canAutoEnable)
                                  }
                                >
                                  {openingAppCode === app.code
                                    ? "Opening Shops..."
                                    : openLabel}
                                </button>
                              </div>

                              {!app.has_access && !canAutoEnable ? (
                                <p className="helper-text">
                                  A workspace owner must enable Shops before
                                  non-owners can open it.
                                </p>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>

                  <section className="dashboard-section">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Create another workspace</p>
                        <h2 className="section-title">Add a new workspace</h2>
                        <p className="muted">
                          This still uses the same authenticated browser session
                          and membership rules from the backend.
                        </p>
                      </div>
                    </div>

                    <WorkspaceCreateForm
                      values={workspaceForm}
                      fieldErrors={createFieldErrors}
                      errorMessage={createError}
                      isSubmitting={isCreatingWorkspace}
                      onNameChange={handleWorkspaceNameChange}
                      onSlugChange={handleWorkspaceSlugChange}
                      onSubmit={handleCreateWorkspace}
                      ids={{
                        name: "workspace-name-secondary",
                        slug: "workspace-slug-secondary",
                      }}
                      submitLabel="Create workspace"
                      submittingLabel="Creating workspace..."
                      helperText="The slug is part of the future workspace URL shape."
                    />
                  </section>
                </>
              )}
            </>
          ) : null}
        </article>
      </section>
    </main>
  );
}

type WorkspaceCreateFormProps = {
  values: WorkspaceFormState;
  fieldErrors: Record<string, string[]>;
  errorMessage: string | null;
  isSubmitting: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  ids: {
    name: string;
    slug: string;
  };
  submitLabel: string;
  submittingLabel: string;
  helperText: string;
};

function WorkspaceCreateForm({
  values,
  fieldErrors,
  errorMessage,
  isSubmitting,
  onNameChange,
  onSlugChange,
  onSubmit,
  ids,
  submitLabel,
  submittingLabel,
  helperText,
}: WorkspaceCreateFormProps) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {errorMessage ? (
        <div className="status-panel error">
          <p className="status-title">Workspace creation failed</p>
          <p className="status-copy">{errorMessage}</p>
        </div>
      ) : null}

      <div className="workspace-form-grid">
        <div className="field">
          <label htmlFor={ids.name}>Workspace name</label>
          <input
            id={ids.name}
            name="name"
            value={values.name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Blue Market"
            required
          />
          {fieldErrors.name?.[0] ? (
            <p className="field-error">{fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={ids.slug}>Workspace slug</label>
          <input
            id={ids.slug}
            name="slug"
            value={values.slug}
            onChange={(event) => onSlugChange(event.target.value)}
            placeholder="blue-market"
            required
          />
          {fieldErrors.slug?.[0] ? (
            <p className="field-error">{fieldErrors.slug[0]}</p>
          ) : (
            <p className="helper-text">{helperText}</p>
          )}
        </div>
      </div>

      <div className="button-row">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
