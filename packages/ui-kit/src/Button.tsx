import type { ButtonHTMLAttributes } from "react";
import { classNames } from "./class-names";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={classNames(
        "nx-button",
        `nx-button--${variant}`,
        fullWidth && "nx-button--full",
        className,
      )}
    />
  );
}
