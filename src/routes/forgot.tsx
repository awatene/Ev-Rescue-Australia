import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/shell";
import { sendTemporaryPassword } from "@/lib/auth/temp-password";

export const Route = createFileRoute("/forgot")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await sendTemporaryPassword({ data: email });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(true);
    } catch {
      setError("The reset email could not be sent. Try again in a few minutes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-extrabold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter the email on your account. A temporary password will be sent there.
        </p>
        {sent ? (
          <p className="mt-4 text-sm" role="status">
            Check that inbox for the temporary password. Sign in with it, then set a new password in your profile.
          </p>
        ) : (
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onSubmit(event)}>
            <label className="grid gap-1 text-sm">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 rounded-md border border-border bg-transparent px-3"
              />
            </label>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
              {busy ? "Sending…" : "Send temporary password"}
            </button>
          </form>
        )}
        <Link to="/login" className="glow-hover mt-6 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
          Back to sign in
        </Link>
      </main>
    </Shell>
  );
}
