import type { ReactNode } from "react";
import { classNames } from "./class-names";

export type DashboardShellProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: DashboardShellProps) {
  return (
    <main className={classNames("nx-dashboard-shell", className)}>
      <section className="nx-dashboard-shell__surface">
        <header className="nx-dashboard-shell__header">
          <div className="nx-dashboard-shell__copy">
            {eyebrow ? (
              <p className="nx-dashboard-shell__eyebrow">{eyebrow}</p>
            ) : null}
            <h1 className="nx-dashboard-shell__title">{title}</h1>
            {description ? (
              <p className="nx-dashboard-shell__description">{description}</p>
            ) : null}
          </div>

          {actions ? (
            <div className="nx-dashboard-shell__actions">{actions}</div>
          ) : null}
        </header>

        <div className={classNames("nx-dashboard-shell__content", contentClassName)}>
          {children}
        </div>
      </section>
    </main>
  );
}
