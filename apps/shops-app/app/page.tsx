const DEFAULT_CORE_APP_BASE = "https://app.nexoraxs.com";

export default function ShopsHomePage() {
  const coreAppBaseUrl = (
    process.env.NEXT_PUBLIC_CORE_APP_BASE ?? DEFAULT_CORE_APP_BASE
  ).replace(/\/$/, "");

  return (
    <main className="screen-shell">
      <section className="placeholder-shell">
        <p className="eyebrow">Shops app placeholder</p>
        <h1 className="page-title">Open Shops from the Core App launcher.</h1>
        <p className="muted">
          This app is workspace-aware. Use the platform shell to choose a
          workspace first, then open Shops from the launcher.
        </p>
        <a className="button" href={`${coreAppBaseUrl}/dashboard`}>
          Back to Core App
        </a>
      </section>
    </main>
  );
}
