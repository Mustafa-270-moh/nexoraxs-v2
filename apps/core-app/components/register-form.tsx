"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { AuthApiError, register } from "@/lib/auth-api";

type RegisterState = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

type RegisterFormProps = {
  initialEmail?: string;
};

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function RegisterForm({ initialEmail = "" }: RegisterFormProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [values, setValues] = useState<RegisterState>({
    name: "",
    email: initialEmail,
    password: "",
    passwordConfirmation: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    console.log("REGISTER FORM HYDRATED");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    console.log("REGISTER SUBMIT HANDLER FIRED");
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.passwordConfirmation,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        setFieldErrors(error.errors);
      } else {
        setErrorMessage("Unexpected frontend error while trying to register.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {errorMessage ? (
        <div className="status-panel error">
          <p className="status-title">Registration failed</p>
          <p className="status-copy">{errorMessage}</p>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="NexoraXS Owner"
          required
        />
        {fieldErrors.name?.[0] ? (
          <p className="field-error">{fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
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
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          placeholder="At least 8 characters"
          required
        />
        {fieldErrors.password?.[0] ? (
          <p className="field-error">{fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="password-confirmation">Confirm password</label>
        <input
          id="password-confirmation"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          value={values.passwordConfirmation}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              passwordConfirmation: event.target.value,
            }))
          }
          placeholder="Repeat password"
          required
        />
      </div>

      <div className="button-row">
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </div>

      {isHydrated ? (
        <p className="muted" data-testid="register-hydration-marker">
          CLIENT HYDRATED: YES
        </p>
      ) : null}
    </form>
  );
}
