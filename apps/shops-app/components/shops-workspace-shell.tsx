"use client";

import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { resolveCoreAppBaseUrl } from "@/lib/core-app-url.mjs";
import {
  SHOPS_BUSINESS_TYPE_OPTIONS,
  SHOPS_COUNTRY_OPTIONS,
  SHOPS_CURRENCY_OPTIONS,
  createInitialShopsSetup,
  formatShopsBusinessTypeLabel,
  formatShopsCountryLabel,
  formatShopsCurrencyLabel,
} from "@/lib/shops-setup.mjs";
import {
  SHOPS_MODE_OPTIONS,
  formatShopsModeLabel,
} from "@/lib/shops-mode.mjs";
import {
  ApiClientError,
  type ShopsBusinessType,
  type ShopsContextData,
  type ShopsCountry,
  type ShopsCurrency,
  type ShopsMode,
  type ShopsSetup,
  getShopsContext,
  storeShopsMode,
  storeShopsSetup,
} from "@/lib/shops-api";

type ShopsWorkspaceShellProps = {
  workspaceSlug: string;
};

type SetupFormState = {
  business_type: ShopsBusinessType;
  country: ShopsCountry;
  currency: ShopsCurrency;
  first_branch_name: string;
};

const pendingShopsContextRequests = new Map<string, Promise<ShopsContextData>>();

function coreAppBaseUrl() {
  return resolveCoreAppBaseUrl(
    process.env.NEXT_PUBLIC_CORE_APP_BASE,
    typeof window === "undefined" ? undefined : window.location.hostname,
  );
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

function createSetupFormState(savedSetup: ShopsSetup | null): SetupFormState {
  return createInitialShopsSetup(savedSetup) as SetupFormState;
}

function resolveApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!(error instanceof ApiClientError)) {
    return fallbackMessage;
  }

  const firstValidationError = Object.values(error.errors)[0]?.[0];

  return firstValidationError ?? error.message;
}

function applyContextState(
  nextContext: ShopsContextData,
  setContext: Dispatch<SetStateAction<ShopsContextData | null>>,
  setSetupForm: Dispatch<SetStateAction<SetupFormState>>,
) {
  setContext(nextContext);
  setSetupForm(createSetupFormState(nextContext.shops_setup));
}

export function ShopsWorkspaceShell({
  workspaceSlug,
}: ShopsWorkspaceShellProps) {
  const [context, setContext] = useState<ShopsContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [isSavingSetup, setIsSavingSetup] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupForm, setSetupForm] = useState<SetupFormState>(() =>
    createSetupFormState(null),
  );

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

        applyContextState(nextContext, setContext, setSetupForm);
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
          resolveApiErrorMessage(
            error,
            "Unexpected frontend error while loading the Shops foundation shell.",
          ),
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
      applyContextState(response.data, setContext, setSetupForm);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        window.location.replace(`${coreAppBaseUrl()}/login`);
        return;
      }

      setErrorMessage(
        resolveApiErrorMessage(
          error,
          "Unexpected frontend error while saving the Shops mode.",
        ),
      );
    } finally {
      setIsSavingMode(false);
    }
  }

  function updateSetupField<FieldName extends keyof SetupFormState>(
    fieldName: FieldName,
    value: SetupFormState[FieldName],
  ) {
    setSetupForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  async function handleSetupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSavingSetup) {
      return;
    }

    setIsSavingSetup(true);
    setErrorMessage(null);

    try {
      const response = await storeShopsSetup(workspaceSlug, {
        business_type: setupForm.business_type,
        country: setupForm.country,
        currency: setupForm.currency,
        first_branch_name: setupForm.first_branch_name.trim() || null,
      });

      applyContextState(response.data, setContext, setSetupForm);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        window.location.replace(`${coreAppBaseUrl()}/login`);
        return;
      }

      setErrorMessage(
        resolveApiErrorMessage(
          error,
          "Unexpected frontend error while saving the Shops setup.",
        ),
      );
    } finally {
      setIsSavingSetup(false);
    }
  }

  const hasAccess = context?.subscription.has_access ?? false;
  const onboardingRequired = context?.onboarding_required ?? false;
  const selectedMode = context?.shops_mode ?? null;
  const setupRequired = context?.setup_required ?? false;
  const savedSetup = context?.shops_setup ?? null;
  const setupComplete = hasAccess && !onboardingRequired && !setupRequired && !!savedSetup;

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
            <li>Shops App owns onboarding, setup, and its placeholder dashboard</li>
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
                Confirming workspace access and reading the saved Shops mode and
                setup state for this workspace.
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="status-panel error">
              <p className="status-title">Unable to continue in Shops</p>
              <p className="status-copy">{errorMessage}</p>
            </div>
          ) : null}

          {!isLoading && context ? (
            <>
              <header>
                <p className="eyebrow">Workspace context</p>
                <h2 className="panel-title">{context.workspace.name}</h2>
                <p className="muted">
                  This placeholder shell keeps one Shops mode and one minimal
                  setup record per workspace before any real commerce modules exist.
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
                <article className="summary-card">
                  <p className="summary-label">Setup status</p>
                  <div className="link-row">
                    <span
                      className={
                        setupComplete
                          ? "status-badge active"
                          : "status-badge pending"
                      }
                    >
                      {setupComplete ? "Completed" : "Pending"}
                    </span>
                  </div>
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
                    <a
                      className="button-secondary"
                      href={`${coreAppBaseUrl()}/dashboard`}
                    >
                      Back to Core App
                    </a>
                  </div>
                </div>
              ) : null}

              {hasAccess && onboardingRequired ? (
                <section className="mode-grid">
                  <div>
                    <p className="eyebrow">Onboarding mode</p>
                    <h3 className="panel-title">
                      Choose how this workspace will start in Shops
                    </h3>
                    <p className="muted">
                      This saves one workspace-level Shops mode and unlocks the
                      setup wizard on later visits.
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
                            void handleModeSelection(option.value as ShopsMode)
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

              {hasAccess && !onboardingRequired && setupRequired ? (
                <section className="setup-grid">
                  <div>
                    <p className="eyebrow">Setup wizard</p>
                    <h3 className="panel-title">Finish the workspace foundation</h3>
                    <p className="muted">
                      This stores one minimal Shops setup record per workspace
                      before the placeholder dashboard is shown.
                    </p>
                  </div>

                  <form className="setup-card" onSubmit={handleSetupSubmit}>
                    <div className="field-grid">
                      <label className="field">
                        <span className="field-label">Business type</span>
                        <select
                          className="field-control"
                          value={setupForm.business_type}
                          onChange={(event) =>
                            updateSetupField(
                              "business_type",
                              event.target.value as ShopsBusinessType,
                            )
                          }
                          disabled={isSavingSetup}
                        >
                          {SHOPS_BUSINESS_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span className="field-label">Country</span>
                        <select
                          className="field-control"
                          value={setupForm.country}
                          onChange={(event) =>
                            updateSetupField(
                              "country",
                              event.target.value as ShopsCountry,
                            )
                          }
                          disabled={isSavingSetup}
                        >
                          {SHOPS_COUNTRY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field">
                        <span className="field-label">Currency</span>
                        <select
                          className="field-control"
                          value={setupForm.currency}
                          onChange={(event) =>
                            updateSetupField(
                              "currency",
                              event.target.value as ShopsCurrency,
                            )
                          }
                          disabled={isSavingSetup}
                        >
                          {SHOPS_CURRENCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="field field-wide">
                        <span className="field-label">First branch name</span>
                        <input
                          className="field-control"
                          type="text"
                          value={setupForm.first_branch_name}
                          onChange={(event) =>
                            updateSetupField(
                              "first_branch_name",
                              event.target.value,
                            )
                          }
                          placeholder="Main Branch"
                          autoComplete="organization"
                          disabled={isSavingSetup}
                        />
                        <span className="helper-copy">
                          Optional for now. Leaving it empty is allowed.
                        </span>
                      </label>
                    </div>

                    <div className="button-row">
                      <button
                        className="button"
                        type="submit"
                        disabled={isSavingSetup}
                      >
                        {isSavingSetup
                          ? "Saving setup..."
                          : "Complete Shops setup"}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {setupComplete && selectedMode && savedSetup ? (
                <>
                  <section className="status-panel info">
                    <p className="status-title">Shops placeholder dashboard</p>
                    <p className="status-copy">
                      This workspace selected{" "}
                      <strong>{formatShopsModeLabel(selectedMode)}</strong> and
                      completed the minimal setup wizard. Later visits now skip
                      onboarding and setup.
                    </p>
                  </section>

                  <div className="summary-grid">
                    <article className="summary-card">
                      <p className="summary-label">Business type</p>
                      <p className="summary-value">
                        {formatShopsBusinessTypeLabel(savedSetup.business_type)}
                      </p>
                    </article>
                    <article className="summary-card">
                      <p className="summary-label">Country</p>
                      <p className="summary-value">
                        {formatShopsCountryLabel(savedSetup.country)}
                      </p>
                    </article>
                    <article className="summary-card">
                      <p className="summary-label">Currency</p>
                      <p className="summary-value">
                        {formatShopsCurrencyLabel(savedSetup.currency)}
                      </p>
                    </article>
                    {savedSetup.first_branch_name ? (
                      <article className="summary-card">
                        <p className="summary-label">First branch name</p>
                        <p className="summary-value">
                          {savedSetup.first_branch_name}
                        </p>
                      </article>
                    ) : null}
                  </div>
                </>
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
