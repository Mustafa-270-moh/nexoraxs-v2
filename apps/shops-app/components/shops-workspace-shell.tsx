"use client";

import { useEffect, useState } from "react";
import {
  ApiClientError,
  type ShopsMode,
  getShopsContext,
  storeShopsMode,
} from "@/lib/shops-api";
import {
  SHOPS_MODE_OPTIONS,
  formatShopsModeLabel,
} from "@/lib/shops-mode.mjs";

type ShopsWorkspaceShellProps = {
  workspaceSlug: string;
};

type ShopsContextData = Awaited<ReturnType<typeof getShopsContext>>["data"];

const DEFAULT_CORE_APP_BASE = "https://app.nexoraxs.com";
const pendingShopsContextRequests = new Map<string, Promise<ShopsContextData>>();

function coreAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_CORE_APP_BASE ?? DEFAULT_CORE_APP_BASE
  ).replace(/\/$/, "");
}

function loadSharedShopsContext(workspaceSlug: string) {
  if (!pendingShopsContextRequests.has(workspaceSlug)) {
    pendingShopsContextRequests.set(
      workspaceSlug,
      getShopsContext(workspaceSlug)
        .then((response) => response.data)
        .finally(() => {
          pendingShopsContextRequests.delete(workspaceSlug);
        }),
    );
  }

  return pendingShopsContextRequests.get(workspaceSlug)!;
}

export function ShopsWorkspaceShell({
  workspaceSlug,
}: ShopsWorkspaceShellProps) {
  const [context, setContext] = useState<ShopsContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadContext() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextContext = await loadSharedShopsContext(workspaceSlug);

        if (!isActive) {
          return;
        }

        setContext(nextContext);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          window.location.replace(`${coreAppBaseUrl()}/login`);
          return;
        }

        setContext(null);
        setErrorMessage(
          error instanceof ApiClientError
            ? error.message
            : "Unexpected frontend error while loading the Shops foundation shell.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      isActive = false;
    };
  }, [workspaceSlug]);

  async function handleModeSelection(mode: ShopsMode) {
    if (isSavingMode) {
      return;
    }

    setIsSavingMode(true);
    setErrorMessage(null);

    try {
      const response = await storeShopsMode(workspaceSlug, mode);
      setContext(response.data);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        window.location.replace(`${coreAppBaseUrl()}/login`);
        return;
      }

      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : "Unexpected frontend error while saving the Shops mode.",
      );
    } finally {
      setIsSavingMode(false);
    }
  }

  const hasAccess = context?.subscription.has_access ?? false;
  const selectedMode = context?.shops_mode ?? null;
  const onboardingRequired = context?.onboarding_required ?? false;

  return (
    <main className="screen-shell">
      <section className="shops-shell">
        <aside className="hero-panel">
          <span className="hero-badge">shops.nexoraxs.com</span>
          <div>
            <p className="eyebrow">Shops placeholder only</p>
            <h1 className="page-title">The commerce product lives here.</h1>
          </div>
          <p className="muted">
            This app will eventually own products, inventory, sales, invoices,
            customers, suppliers, expenses, reports, branches, storefronts, and
            online orders. None of those modules are implemented in this phase.
          </p>
          <ul className="hero-list">
            <li>Core App owns auth, workspace selection, and app launch</li>
            <li>Shops App owns its own onboarding and placeholder dashboard</li>
            <li>Workspace context is always route-driven through `/w/{'{'}workspaceSlug{'}'}`</li>
          </ul>
          <p className="hero-note">
            Current workspace slug: {workspaceSlug}
          </p>
        </aside>

        <section className="content-panel">
          {isLoading ? (
            <div className="status-panel info">
              <p className="status-title">Loading Shops foundation</p>
              <p className="status-copy">
                Confirming workspace access and reading the saved Shops mode for
                this workspace.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="status-panel error">
              <p className="status-title">Unable to load Shops</p>
              <p className="status-copy">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && context ? (
            <>
              <header>
                <p className="eyebrow">Workspace context</p>
                <h2 className="panel-title">{context.workspace.name}</h2>
                <p className="muted">
                  This placeholder shell reads workspace access from the backend
                  and persists one onboarding mode per workspace.
                </p>
              </header>

              <div className="summary-grid">
                <article className="summary-card">
                  <p className="summary-label">Workspace</p>
                  <p className="summary-value">{context.workspace.slug}</p>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Current role</p>
                  <p className="summary-value">{context.current_user_role}</p>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Shops access</p>
                  <div className="link-row">
                    <span
                      className={
                        hasAccess
                          ? "status-badge active"
                          : "status-badge pending"
                      }
                    >
                      {hasAccess ? "Active" : "Not enabled"}
                    </span>
                  </div>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Selected mode</p>
                  <p className="summary-value">
                    {selectedMode
                      ? formatShopsModeLabel(selectedMode)
                      : "Not selected yet"}
                  </p>
                </article>
              </div>

              {!hasAccess ? (
                <div className="status-panel info">
                  <p className="status-title">Shops is not enabled yet</p>
                  <p className="status-copy">
                    The Core App launcher or future subscription settings must
                    activate Shops for this workspace before the product shell
                    can continue.
                  </p>
                  <div className="button-row" style={{ marginTop: 12 }}>
                    <a className="button-secondary" href={`${coreAppBaseUrl()}/dashboard`}>
                      Back to Core App
                    </a>
                  </div>
                </div>
              ) : null}

              {hasAccess && onboardingRequired ? (
                <section className="mode-grid">
                  <div>
                    <p className="eyebrow">Onboarding mode</p>
                    <h3 className="panel-title">Choose how this workspace will start in Shops</h3>
                    <p className="muted">
                      This saves one workspace-level Shops mode and skips this
                      onboarding screen on later visits.
                    </p>
                  </div>

                  {SHOPS_MODE_OPTIONS.map((option) => (
                    <article className="mode-card" key={option.value}>
                      <div className="mode-card-header">
                        <div>
                          <span className="mode-badge">Mode option</span>
                          <h4 className="mode-title">{option.label}</h4>
                        </div>
                      </div>
                      <p className="mode-copy">{option.description}</p>
                      <div className="button-row">
                        <button
                          className="mode-button"
                          type="button"
                          onClick={() =>
                            void handleModeSelection(
                              option.value as ShopsMode,
                            )
                          }
                          disabled={isSavingMode}
                        >
                          {isSavingMode
                            ? "Saving mode..."
                            : `Use ${option.label}`}
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              ) : null}

              {hasAccess && !onboardingRequired && selectedMode ? (
                <section className="status-panel info">
                  <p className="status-title">Shops placeholder dashboard</p>
                  <p className="status-copy">
                    The selected mode for this workspace is{" "}
                    <strong>{formatShopsModeLabel(selectedMode)}</strong>. Later
                    visits now skip onboarding and land directly on this
                    placeholder dashboard.
                  </p>
                </section>
              ) : null}

              <div className="link-row">
                <a className="button-secondary" href={`${coreAppBaseUrl()}/dashboard`}>
                  Back to Core App
                </a>
                <a className="link-muted" href={`${coreAppBaseUrl()}/dashboard`}>
                  Return to workspace launcher
                </a>
              </div>
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
