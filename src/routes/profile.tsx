import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";
import { checkTemporaryPassword, needsTemporaryPassword, replaceTemporaryPassword } from "@/lib/auth/temp-password";
import { SITE_EMAIL } from "@/lib/market/data";
import { adsCheckedToday } from "@/lib/market/review-day";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, messages, accounts, cars, parts, services, flags, setIntent, updateUser } = useMarket();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"private" | "dealer">("private");
  const [checkedToday, setCheckedToday] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [abn, setAbn] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setBusinessName(user.businessName ?? "");
    setAbn(user.abn ?? "");
  }, [user]);

  useEffect(() => {
    if (user) return;
    setIntent({ kind: "profile" });
    void navigate({ to: "/login" });
  }, [user, navigate, setIntent]);

  useEffect(() => {
    setCheckedToday(adsCheckedToday());
  }, []);

  if (!user) {
    return (
      <Shell>
        <main className="mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-muted">Sign in to see your profile.</p>
        </main>
      </Shell>
    );
  }

  const address = user.email.toLowerCase();
  const unread = messages.filter((message) => {
    if (message.sellerEmail.toLowerCase() === address && !message.read) return true;
    if (message.buyerEmail.toLowerCase() !== address || !message.reply) return false;
    const seen = Number(window.localStorage.getItem(`evrescue.reply-seen.${message.id}`) || 0);
    return (message.replyAt || message.createdAt) > seen;
  }).length;
  const waiting =
    cars.filter((car) => car.review === "pending").length +
    parts.filter((part) => part.review === "pending").length +
    services.filter((service) => service.review === "pending").length +
    flags.filter((flag) => flag.status === "open").length;
  const isAdmin = user.email.toLowerCase() === SITE_EMAIL;
  const letters = user.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Shell>
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-16">
        <span className="relative">
          {user.photo ? (
            <img src={user.photo} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#bfdbfe] text-3xl font-bold text-[#1e3a8a]">
              {letters || "?"}
            </span>
          )}
          {isAdmin || unread > 0 ? (
            <Link
              to="/inbox"
              className="absolute top-0 right-0 flex h-8 min-w-8 items-center justify-center rounded-full border border-[#dc2626] bg-[#f59e0b] px-1.5 text-sm font-extrabold text-[#1c1917]"
              aria-label={`${unread} messages`}
            >
              {unread}
            </Link>
          ) : null}
        </span>
        <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
        <p className="mt-1 text-sm text-muted">{user.role === "dealer" ? "Dealer" : "Private seller"}</p>
        {user.role === "dealer" && user.businessName ? <p className="mt-1 text-sm">{user.businessName}</p> : null}
        {user.role === "dealer" && user.abn ? <p className="text-sm text-muted">ABN {formatAbn(user.abn)}</p> : null}
        {isAdmin && waiting > 0 && !checkedToday ? (
          <p className="mt-4 rounded-md border border-accent bg-surface px-4 py-3 text-sm">
            {waiting} {waiting === 1 ? "ad is" : "ads are"} waiting. Check them today.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/inbox" className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
            Inbox ({unread})
          </Link>
          <Link to="/my-ads" className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
            My ads
          </Link>
          {isAdmin ? (
            <Link to="/admin" className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
              Check ads{waiting > 0 ? ` (${waiting})` : ""}
            </Link>
          ) : null}
          <button
            type="button"
            className="glow-hover min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
            onClick={() => fileRef.current?.click()}
          >
            Upload profile picture
          </button>
          <button
            type="button"
            className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
            onClick={() => setEditing((value) => !value)}
          >
            Edit
          </button>
        </div>
        <ChangePassword email={user.email} />
        {editing ? (
          <section className="mt-6 w-full rounded-md border border-border bg-surface p-4">
            {user.photo ? (
              <button type="button" className="glow-hover min-h-11 rounded-md border border-border px-4 text-sm font-semibold" onClick={() => updateUser({ photo: undefined })}>
                Remove picture
              </button>
            ) : null}
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">Profile name</span>
              <input
                className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input
                type="email"
                className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <p className="mt-4 text-sm font-medium">Seller type</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-md border px-4 text-sm font-semibold ${role === "private" ? "border-accent bg-accent text-accent-ink" : "border-border"}`}
                onClick={() => setRole("private")}
              >
                Private seller
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-md border px-4 text-sm font-semibold ${role === "dealer" ? "border-accent bg-accent text-accent-ink" : "border-border"}`}
                onClick={() => setRole("dealer")}
              >
                Dealer
              </button>
            </div>
            {role === "dealer" ? (
              <>
                <label className="mt-4 block text-sm">
                  <span className="mb-1 block font-medium">Business name</span>
                  <input
                    className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                  />
                </label>
                <label className="mt-4 block text-sm">
                  <span className="mb-1 block font-medium">ABN</span>
                  <input
                    inputMode="numeric"
                    className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
                    value={abn}
                    onChange={(event) => setAbn(event.target.value)}
                  />
                </label>
              </>
            ) : null}
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            <button
              type="button"
              className="glow-hover mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
              onClick={() => {
                const trimmedName = name.trim();
                const trimmedEmail = email.trim();
                if (trimmedName.length < 2) {
                  setError("Enter your profile name.");
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                  setError("Enter a valid email address.");
                  return;
                }
                if (role === "dealer" && !businessName.trim()) {
                  setError("Enter the business name.");
                  return;
                }
                const digits = abn.replace(/\D/g, "");
                if (role === "dealer" && digits.length !== 11) {
                  setError("Enter an 11-digit ABN.");
                  return;
                }
                if (
                  accounts.some(
                    (account) =>
                      account.email.toLowerCase() === trimmedEmail.toLowerCase() &&
                      account.email.toLowerCase() !== user.email.toLowerCase(),
                  )
                ) {
                  setError("That email is already used.");
                  return;
                }
                setError("");
                updateUser({
                  name: trimmedName,
                  email: trimmedEmail,
                  role,
                  businessName: role === "dealer" ? businessName.trim() : undefined,
                  abn: role === "dealer" ? digits : undefined,
                });
                setEditing(false);
              }}
            >
              Save
            </button>
          </section>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) {
              setError("Choose a photo.");
              return;
            }
            void readPhoto(file).then(
              (photo) => {
                setError("");
                updateUser({ photo });
              },
              () => setError("That photo could not be used. Try a smaller image."),
            );
          }}
        />
      </main>
    </Shell>
  );
}

function formatAbn(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
];

function ChangePassword({ email }: { email: string }) {
  const [needed, setNeeded] = useState(false);
  const [step, setStep] = useState<"current" | "next" | "done">("current");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void needsTemporaryPassword({ data: email }).then((value) => {
      if (live) setNeeded(value);
    });
    return () => {
      live = false;
    };
  }, [email]);

  if (step === "done") {
    return <p className="mt-6 w-full text-sm text-accent">Your password has been changed. Use it the next time you sign in.</p>;
  }

  if (!needed) return null;

  const ready = PASSWORD_RULES.every((rule) => rule.test(next));

  return (
    <section className="mt-6 w-full rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg font-bold">Change password</h2>
      <p className="mt-1 text-sm text-muted">You signed in with a temporary password. Enter it, then choose a new one.</p>
      {step === "current" ? (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            void checkTemporaryPassword({ data: { email, password: current } })
              .then((result) => {
                setBusy(false);
                if ("error" in result) {
                  setError(result.error);
                  return;
                }
                setStep("next");
              })
              .catch(() => {
                setBusy(false);
                setError("That temporary password could not be checked. Try again.");
              });
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">Temporary password</span>
            <PasswordInput
              autoComplete="current-password"
              className="min-h-11 w-full rounded-md border border-border bg-bg px-3"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" disabled={busy || !current}>
            Continue
          </button>
        </form>
      ) : (
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!ready || next !== confirm) return;
            setError("");
            setBusy(true);
            void replaceTemporaryPassword({ data: { email, current, next } })
              .then((result) => {
                setBusy(false);
                if ("error" in result) {
                  setError(result.error);
                  return;
                }
                setStep("done");
                setNeeded(false);
              })
              .catch(() => {
                setBusy(false);
                setError("The password could not be changed. Try again.");
              });
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium">New password</span>
            <PasswordInput
              autoComplete="new-password"
              className={`min-h-11 w-full rounded-md border bg-bg px-3 ${next.length > 0 && !ready ? "border-danger" : "border-border"}`}
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </label>
          <ul className="grid gap-1 text-sm">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(next);
              return (
                <li key={rule.label} className={met ? "text-accent" : "text-danger"}>
                  {met ? "Met" : "Needed"}: {rule.label}
                </li>
              );
            })}
          </ul>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Confirm password</span>
            <PasswordInput
              autoComplete="new-password"
              className={`min-h-11 w-full rounded-md border bg-bg px-3 ${confirm.length > 0 && confirm !== next ? "border-danger" : "border-border"}`}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" disabled={busy || !ready || next !== confirm}>
            Save new password
          </button>
        </form>
      )}
    </section>
  );
}

function readPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("image"));
      image.onload = () => {
        const size = 256;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("canvas"));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
