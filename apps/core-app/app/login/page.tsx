import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import {
  buildSafeEmailPrefillPath,
  readEmailPrefill,
} from "@/lib/email-prefill";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const safePath = buildSafeEmailPrefillPath("/login", resolvedSearchParams);

  if (safePath) {
    redirect(safePath);
  }

  const initialEmail = readEmailPrefill(resolvedSearchParams.email);

  return (
    <AuthShell
      eyebrow="Core Access"
      title="Sign in to the NexoraXS core shell."
      description="This is the minimal frontend shell for Sanctum cookie-based authentication on app.nexoraxs.com."
      asideNote="The browser owns the session. No localStorage tokens. No JWT."
    >
      <LoginForm initialEmail={initialEmail} />
      <div className="helper-row">
        <p className="muted">Need a fresh account for testing?</p>
        <Link className="helper-link" href="/register">
          Create one at /register
        </Link>
      </div>
    </AuthShell>
  );
}
