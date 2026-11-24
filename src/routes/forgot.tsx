import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SITE_EMAIL } from "@/lib/market/data";

export const Route = createFileRoute("/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <Shell>
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-extrabold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted">
          A reset email is not connected yet, so a new password is not created here. Email {SITE_EMAIL} from the address on your account and ask for a reset.
        </p>
        <p className="mt-4 text-sm">
          <a className="text-accent underline" href={`mailto:${SITE_EMAIL}`}>
            {SITE_EMAIL}
          </a>
        </p>
        <Link to="/login" className="glow-hover mt-6 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
          Back to sign in
        </Link>
      </main>
    </Shell>
  );
}