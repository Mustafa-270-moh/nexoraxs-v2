import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import {
  buildSafeEmailPrefillPath,
  readEmailPrefill,
} from "@/lib/email-prefill";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const resolvedSearchParams = await searchParams;
  const safePath = buildSafeEmailPrefillPath("/register", resolvedSearchParams);

  if (safePath) {
    redirect(safePath);
  }

  const initialEmail = readEmailPrefill(resolvedSearchParams.email);

  return (
    <AuthShell
      eyebrow="Auth Bootstrap"
      title="Create a core test account."
      description="Registration writes only to the default Laravel users table and starts a Sanctum session for the current browser."
      asideNote="No workspaces, no shops, and no billing are attached yet."
    >
      <RegisterForm initialEmail={initialEmail} />
      <div className="helper-row">
        <p className="muted">Already created a user?</p>
        <Link className="helper-link" href="/login">
          Go to /login
        </Link>
      </div>
    </AuthShell>
  );
}
