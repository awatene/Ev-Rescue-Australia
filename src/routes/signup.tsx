import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Charging } from "@/components/charging";
import { PasswordInput } from "@/components/password-input";
import { Shell } from "@/components/shell";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { useMarket } from "@/components/market-provider";
import { continueHref } from "@/components/continue";
import { isAuPhone } from "@/lib/market/data";
import { authClient } from "@/lib/auth/client";
import type { Role, User } from "@/lib/market/types";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

function passwordReady(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { user, accounts, signInUser, consumeIntent } = useMarket();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState("");

  function finish(next: User) {
    signInUser(next);
    const intent = consumeIntent();
    void navigate({ href: continueHref(intent) });
  }

  useEffect(() => {
    if (!user) return;
    const intent = consumeIntent();
    if (!intent) return;
    void navigate({ href: continueHref(intent) });
  }, [user, consumeIntent, navigate]);

  return (
    <Shell>
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-extrabold">Create account</h1>
        <p className="mt-2 text-sm text-muted">Sign up to message sellers, see phone numbers, and place ads.</p>
        <p className="mt-3 text-xs text-muted">Google, Apple, Facebook, and X use your real account. Or create an email and password.</p>
        <div className="mt-4 grid gap-2">
          <SocialAuthButtons
            callbackURL="/signup"
            busy={busy}
            onBusy={setBusy}
            onError={(message) => setErrors(message ? [message] : [])}
          />
        </div>
        <p className="my-4 text-center text-sm text-muted">or sign up with email</p>
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
            const trimmedName = name.trim();
            const trimmedEmail = email.trim();
            const trimmedPhone = phone.trim();
            if (trimmedName.length < 2) nextErrors.push("Enter your full name.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) nextErrors.push("Enter a valid email address.");
            if (accounts.some((account) => account.email.toLowerCase() === trimmedEmail.toLowerCase())) {
              nextErrors.push("An account with this email already exists. Sign in instead.");
            }
            if (trimmedPhone && !isAuPhone(trimmedPhone)) {
              nextErrors.push("Enter a valid Australian phone number, for example 0412 345 678.");
            }
            if (!role) nextErrors.push("Choose private seller or dealer.");
            if (!passwordReady(password)) nextErrors.push("Password does not meet the strength requirements.");
            if (password !== confirm) nextErrors.push("Passwords do not match.");
            if (!terms) nextErrors.push("Please agree to the terms and conditions.");
            setErrors(nextErrors);
            if (nextErrors.length || !role) return;
            setBusy("email");
            void authClient.signUp
              .email({ name: trimmedName, email: trimmedEmail, password })
              .then(({ error }) => {
                if (error) {
                  setBusy("");
                  setErrors([error.message || "That email could not be registered. Sign in if you already have an account."]);
                  return;
                }
                finish({
                  name: trimmedName,
                  email: trimmedEmail,
                  phone: trimmedPhone,
                  role,
                  provider: "Email",
                });
              })
              .catch(() => {
                setBusy("");
                setErrors(["Sign-up did not finish. Try again."]);
              });
          }}
        >
          <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
          <Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <Field label="Phone (optional)" value={phone} onChange={setPhone} type="tel" autoComplete="tel" placeholder="04xx xxx xxx" />
          <label className="text-sm">
            <span className="mb-1 block font-medium">I am a</span>
            <select
              className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
              value={role}
              onChange={(event) => setRole(event.target.value as "" | Role)}
            >
              <option value="">Select…</option>
              <option value="private">Private seller</option>
              <option value="dealer">Dealer</option>
            </select>
          </label>
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete="new-password"
            invalid={password.length > 0 && !passwordReady(password)}
          />
          <ul className="grid gap-1 text-sm" aria-label="Password strength requirements">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.label} className={met ? "text-accent" : "text-danger"}>
                  {met ? "Met" : "Needed"}: {rule.label}
                </li>
              );
            })}
          </ul>
          <Field
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            type="password"
            autoComplete="new-password"
            invalid={confirm.length > 0 && confirm !== password}
          />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
            I agree to the terms and conditions
          </label>
          <button type="submit" className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" disabled={busy === "email"}>
            Create account
          </button>
          {busy === "email" ? <Charging label="Creating your account…" /> : null}
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
        </p>
      </main>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  const className = `min-h-11 w-full rounded-md border bg-bg px-3 ${invalid ? "border-danger" : "border-border"}`;
  const shared = {
    autoComplete,
    placeholder,
    "aria-invalid": invalid || undefined,
    className,
    value,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {type === "password" ? <PasswordInput {...shared} /> : <input type={type} {...shared} />}
    </label>
  );
}
