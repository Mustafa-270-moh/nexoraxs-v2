import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./class-names";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
};

export function Card({
  title,
  description,
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section {...props} className={classNames("nx-card", className)}>
      {title || description ? (
        <header className="nx-card__header">
          {title ? <h2 className="nx-card__title">{title}</h2> : null}
          {description ? (
            <p className="nx-card__description">{description}</p>
          ) : null}
        </header>
      ) : null}

      <div className="nx-card__body">{children}</div>

      {footer ? <footer className="nx-card__footer">{footer}</footer> : null}
    </section>
  );
}
