import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Charging } from "@/components/charging";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";
import { continueHref } from "@/components/continue";
import { authClient, signIn, signInWithGoogle } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

let routedEmail = "";

function LoginPage() {
  const { user, accounts, signInUser, consumeIntent } = useMarket();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [socialError, setSocialError] = useState("");
  const [busy, setBusy] = useState("");

  function goAfter(nextEmail: string) {
    if (routedEmail === nextEmail) return;
    routedEmail = nextEmail;
    const intent = consumeIntent();
    if (intent?.kind === "admin") {
      void navigate({ href: continueHref(intent) });
      return;
    }
    void navigate({ to: "/" });
  }

  useEffect(() => {
    if (!user) {
      routedEmail = "";
      return;
    }
    goAfter(user.email);
  }, [user, consumeIntent, navigate]);

  function continueWithGoogle() {
    setSocialError("");
    setBusy("google");
    void signInWithGoogle({ callbackURL: "/login" }).catch(() => {
      setBusy("");
      setSocialError("Google sign-in did not finish. Try again.");
    });
  }

  function continueWith(providerId: "grok-google" | "grok-x") {
    setSocialError("");
    setBusy(providerId);
    void signIn(providerId, { callbackURL: "/login" }).catch(() => {
      setBusy("");
      setSocialError("Sign-in did not finish. Allow pop-ups and try again.");
    });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-extrabold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Log in to message sellers, see workshop contact details, and place ads.</p>
        <p className="mt-3 text-xs text-muted">Google and X use your real account. Email uses the password you created here.</p>
        {user ? <p className="mt-3 text-sm">You are signed in as {user.email}.</p> : null}
        <div className="mt-4 grid gap-2">
          <button type="button" className="glow-hover min-h-11 rounded-md border border-border text-sm font-semibold" onClick={continueWithGoogle}>
            Continue with Google
          </button>
          <button type="button" className="glow-hover min-h-11 rounded-md border border-border text-sm font-semibold" onClick={() => continueWith("grok-x")}>
            Continue with X
          </button>
          {busy === "google" || busy.startsWith("grok-") ? <Charging label="Signing in…" /> : null}
          {socialError ? <p className="text-sm text-danger" role="alert">{socialError}</p> : null}
        </div>
        <p className="my-4 text-center text-sm text-muted">or</p>
        {errors.length ? (
          <ul className="mb-3 list-disc space-y-1 rounded-md border border-danger p-3 pl-8 text-sm text-danger" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors: string[] = [];
            const trimmed = email.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) nextErrors.push("Enter a valid email address.");
            if (password.length < 8) nextErrors.push("Password must be at least 8 characters.");
            setErrors(nextErrors);
            if (nextErrors.length) return;
            setBusy("email");
            void authClient.signIn
              .email({ email: trimmed, password })
              .then(({ error }) => {
                if (error) {
                  setErrors(["That email or password is not right. Create an account if you have not yet."]);
                  setBusy("");
                  return;
                }
                const known = accounts.find((account) => account.email.toLowerCase() === trimmed.toLowerCase());
                signInUser({
                  email: trimmed,
                  name: known?.name || trimmed.split("@")[0] || "Member",
                  phone: known?.phone || "",
                  role: known?.role || "private",
                  provider: "Email",
                  photo: known?.photo,
                });
                goAfter(trimmed);
              })
              .catch(() => {
                setBusy("");
                setErrors(["Sign-in did not finish. Try again."]);
              });
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              autoComplete="username"
              className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="min-h-11 w-full rounded-md border border-border bg-bg px-3 pr-12"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="absolute top-0 right-0 flex min-h-11 min-w-11 items-center justify-center text-muted"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((open) => !open)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </span>
          </label>
          <button type="button" className="text-left text-sm font-semibold text-accent" onClick={() => void navigate({ to: "/forgot" })}>
            Forgot password?
          </button>
          <button type="submit" className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" disabled={busy === "email"}>
            Sign in
          </button>
          {busy === "email" ? <Charging label="Signing in…" /> : null}
        </form>
        <button
          type="button"
          className="glow-hover mt-4 min-h-11 w-full rounded-md border border-border text-sm font-semibold"
          onClick={() => void navigate({ to: "/signup" })}
        >
          No account yet? Create one
        </button>
      </main>
    </Shell>
  );
}
