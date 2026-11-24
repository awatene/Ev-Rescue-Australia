import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";
import { SITE_EMAIL } from "@/lib/market/data";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { user } = useMarket();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !message.trim()) {
      setError("Enter your name, a valid email and a message.");
      setSent(false);
      return;
    }
    setError("");
    setSending(true);
    try {
      const response = await fetch("https://formspree.io/f/xjywpglw", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: "Help message for EV Rescue",
          name: name.trim(),
          email: email.trim(),
          message: `To: ${SITE_EMAIL}\n\n${message.trim()}`,
        }),
      });
      if (!response.ok) throw new Error("send");
      setSent(true);
      setMessage("");
    } catch {
      setError("The message did not send. Try again in a moment.");
      setSent(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">Help</h1>
        <p className="mt-2 text-sm text-muted">
          This goes to <a className="text-accent underline" href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>. Press Send and it arrives in that inbox. It does not open your email app.
        </p>
        <form className="mt-6 grid gap-3" onSubmit={submit}>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <input className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input className="min-h-11 w-full rounded-md border border-border bg-bg px-3" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Message</span>
            <textarea className="min-h-32 w-full rounded-md border border-border bg-bg px-3 py-2" value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
          {sent ? <p className="text-sm text-accent" role="status">Sent to {SITE_EMAIL}.</p> : null}
          <button type="submit" className="contact-glow glow-hover min-h-11 rounded-md bg-accent text-sm font-semibold text-accent-ink" disabled={sending}>
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      </main>
    </Shell>
  );
}
