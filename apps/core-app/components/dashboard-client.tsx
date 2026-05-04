"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ApiClientError,
  type AuthUser,
  type Workspace,
  createWorkspace,
  getCurrentUser,
  getWorkspaces,
  logout,
} from "@/lib/auth-api";

type WorkspaceFormState = {
  name: string;
  slug: string;
};

function normalizeWorkspaceSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function DashboardClient() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshingWorkspaces, setIsRefreshingWorkspaces] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormState>({
    name: "",
    slug: "",
  });
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setDashboardError(null);

      try {
        const [userResponse, workspacesResponse] = await Promise.all([
          getCurrentUser(),
          getWorkspaces(),
        ]);

        if (!isActive) {
          return;
        }

        setUser(userResponse.data.user);
        setWorkspaces(workspacesResponse.data);
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

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
      router.refresh();
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

  async function refreshWorkspaceList() {
    setIsRefreshingWorkspaces(true);
    setDashboardError(null);

    try {
      const response = await getWorkspaces();
      setWorkspaces(response.data);
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

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingWorkspace(true);
    setCreateError(null);
    setCreateFieldErrors({});

    try {
      await createWorkspace(workspaceForm);
      setWorkspaceForm({ name: "", slug: "" });
      setSlugWasEdited(false);
      await refreshWorkspaceList();
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
              <p className="eyebrow">Client-side guarded route</p>
              <h1 className="dashboard-title">Core dashboard shell</h1>
              <p className="muted">
                This page calls <code>/api/auth/me</code> and{" "}
                <code>/api/workspaces</code> on load, then renders the minimal
                workspace foundation for the authenticated user.
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
                    Workspace foundation only
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
                      No workspaces found yet. This phase only covers listing
                      and creating workspaces for the current authenticated
                      session.
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
                        <p className="eyebrow">Workspace list</p>
                        <h2 className="section-title">Your workspaces</h2>
                        <p className="muted">
                          Only workspaces the current user belongs to appear
                          here.
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
                          : "Refresh list"}
                      </button>
                    </div>

                    <div className="workspace-list">
                      {workspaces.map((workspace) => (
                        <article
                          className="workspace-item"
                          key={workspace.id}
                        >
                          <div>
                            <p className="workspace-name">{workspace.name}</p>
                            <p className="workspace-slug">
                              /w/{workspace.slug}
                            </p>
                          </div>
                          <div className="workspace-meta-group">
                            <span className="workspace-role">
                              Role: {workspace.role ?? "member"}
                            </span>
                            <span className="workspace-meta">
                              Account: {workspace.account_id}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
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
