"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthApiError, login } from "@/lib/auth-api";

type LoginState = {
  email: string;
  password: string;
};

type LoginFormProps = {
  initialEmail?: string;
};

export function LoginForm({ initialEmail = "" }: LoginFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LoginState>({
    email: initialEmail,
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await login(values);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        setFieldErrors(error.errors);
      } else {
        setErrorMessage("Unexpected frontend error while trying to sign in.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMessage ? (
        <div className="status-panel error">
          <p className="status-title">Sign-in failed</p>
          <p className="status-copy">{errorMessage}</p>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          placeholder="owner@example.com"
          required
        />
        {fieldErrors.email?.[0] ? (
          <p className="field-error">{fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          placeholder="Use your account password"
          required
        />
        {fieldErrors.password?.[0] ? (
          <p className="field-error">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="button-row">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
