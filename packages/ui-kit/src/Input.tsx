import type { InputHTMLAttributes, ReactNode } from "react";
import { classNames } from "./class-names";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: ReactNode;
  hint?: ReactNode;
  errorMessage?: ReactNode;
  containerClassName?: string;
};

export function Input({
  label,
  hint,
  errorMessage,
  id,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <div className={classNames("nx-input-field", containerClassName)}>
      {label ? (
        <label className="nx-input-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}

      <input
        {...props}
        id={id}
        className={classNames("nx-input", className)}
        aria-invalid={errorMessage ? true : props["aria-invalid"]}
      />

      {errorMessage ? (
        <p className="nx-input-field__error">{errorMessage}</p>
      ) : hint ? (
        <p className="nx-input-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
