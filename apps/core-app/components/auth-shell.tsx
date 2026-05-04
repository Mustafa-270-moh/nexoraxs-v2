import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideNote: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  asideNote,
  children,
}: AuthShellProps) {
  return (
    <main className="screen-shell">
      <section className="auth-shell">
        <aside className="hero-panel">
          <div className="hero-copy">
            <span className="hero-kicker">app.nexoraxs.com</span>
            <h1>Cookie-based auth. Nothing more yet.</h1>
            <p>
              The Core App is intentionally small in this phase: login,
              registration, authenticated identity fetch, and logout against the
              existing Laravel Sanctum API.
            </p>
            <ul className="hero-points">
              <li>Calls /sanctum/csrf-cookie before mutating requests</li>
              <li>Sends credentials with every API request</li>
              <li>Reads XSRF token from browser cookies for POST requests</li>
            </ul>
          </div>
          <p className="auth-note">{asideNote}</p>
        </aside>

        <section className="auth-card">
          <header className="auth-header">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p className="muted">{description}</p>
          </header>
          {children}
        </section>
      </section>
    </main>
  );
}
