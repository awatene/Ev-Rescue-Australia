import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { useMarket } from "@/components/market-provider";
import type { AdMessage } from "@/lib/market/types";

export const Route = createFileRoute("/inbox")({
  validateSearch: (search: Record<string, unknown>): { open?: string } => {
    if (typeof search.open === "string" && search.open) return { open: search.open };
    return {};
  },
  component: InboxPage,
});

function seenKey(id: string) {
  return `evrescue.reply-seen.${id}`;
}

function replyUnseen(message: AdMessage, email: string) {
  if (typeof window === "undefined") return false;
  if (message.buyerEmail.toLowerCase() !== email.toLowerCase() || !message.reply) return false;
  const seen = Number(window.localStorage.getItem(seenKey(message.id)) || 0);
  return (message.replyAt || message.createdAt) > seen;
}

function markReplySeen(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(seenKey(id), String(Date.now()));
}

function InboxPage() {
  const { user, accounts, cars, parts, messages, setIntent, markMessageRead, replyToMessage } = useMarket();
  const navigate = useNavigate();
  const { open } = Route.useSearch();
  const email = user?.email ?? "";

  useEffect(() => {
    if (!email) {
      setIntent({ kind: "inbox" });
      void navigate({ to: "/login" });
      return;
    }
    if (!open) return;
    const message = messages.find((item) => item.id === open);
    if (message && message.sellerEmail.toLowerCase() === email.toLowerCase()) markMessageRead(open);
    if (message && message.buyerEmail.toLowerCase() === email.toLowerCase() && message.reply) markReplySeen(open);
  }, [email, markMessageRead, messages, navigate, open, setIntent]);

  if (!user) {
    return (
      <Shell>
        <main className="mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-muted">Sign in to see your inbox.</p>
        </main>
      </Shell>
    );
  }

  const mine = messages
    .filter(
      (message) =>
        message.sellerEmail.toLowerCase() === user.email.toLowerCase() ||
        message.buyerEmail.toLowerCase() === user.email.toLowerCase(),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  const opened = open ? mine.find((message) => message.id === open) : undefined;
  const unseenReplies = mine.filter((message) => replyUnseen(message, user.email)).length;
  const buyerThreads = mine.some((message) => message.buyerEmail.toLowerCase() === user.email.toLowerCase());

  if (opened) {
    const sellerView = opened.sellerEmail.toLowerCase() === user.email.toLowerCase();
    const otherEmail = sellerView ? opened.buyerEmail : opened.sellerEmail;
    const person = accounts.find((account) => account.email.toLowerCase() === otherEmail.toLowerCase());
    const name = sellerView ? opened.buyerName : person?.name || "Seller";
    return (
      <Shell>
        <main className="mx-auto max-w-xl px-4 py-6">
          <Link to="/inbox" className="text-sm font-semibold text-accent">
            Inbox
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <PersonFace name={name} photo={person?.photo} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              <p className="text-xs text-muted">{when(opened.createdAt)}</p>
            </div>
          </div>
          {sellerView ? null : (
            <p className="mt-4 rounded-md border border-accent bg-surface px-4 py-3 text-sm">
              Never pay a deposit or send money before you have seen the vehicle.{" "}
              <Link
                to="/"
                search={{ open: `${opened.kind}:${opened.adId}` }}
                className="font-semibold text-accent underline"
              >
                Report
              </Link>{" "}
              any suspicious ads. The ad stays up until we check it.
            </p>
          )}
          <p className="mt-4 max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm">{opened.text}</p>
          {opened.reply ? (
            <p className="mt-3 ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-sm text-accent-ink">
              {opened.reply}
            </p>
          ) : sellerView ? (
            <p className="mt-3 text-sm text-muted">No reply yet.</p>
          ) : (
            <p className="mt-3 rounded-md border border-accent bg-surface px-4 py-3 text-sm">
              No reply yet. Check this inbox again later. The seller answers here, not by email.
            </p>
          )}
          {sellerView ? <ReplyBox key={opened.id} onSend={(text) => replyToMessage(opened.id, text)} /> : null}
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="mt-3 rounded-md border border-accent bg-surface px-4 py-3 text-sm">
          {unseenReplies > 0
            ? `${unseenReplies === 1 ? "A seller has replied." : `${unseenReplies} sellers have replied.`} Open the message below.`
            : "Check this inbox each day. Seller replies show up here, not by email."}
        </p>
        {buyerThreads ? (
          <p className="mt-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
            Never pay a deposit or send money before you have seen the vehicle. Report any suspicious ads. The ad stays up until we check it.
          </p>
        ) : null}
        {mine.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No messages yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {mine.map((message) => {
              const sellerView = message.sellerEmail.toLowerCase() === user.email.toLowerCase();
              const otherEmail = sellerView ? message.buyerEmail : message.sellerEmail;
              const person = accounts.find((account) => account.email.toLowerCase() === otherEmail.toLowerCase());
              return (
              <MessageRow
                key={message.id}
                message={message}
                name={sellerView ? message.buyerName : person?.name || "Seller"}
                preview={sellerView ? message.text : message.reply || "No reply yet."}
                glow={(sellerView && !message.read) || replyUnseen(message, user.email)}
                photo={person?.photo}
                thumb={
                  message.kind === "car"
                    ? cars.find((car) => car.id === message.adId)?.photos[0]
                    : parts.find((part) => part.id === message.adId)?.photos[0]
                }
              />
              );
            })}
          </ul>
        )}
      </main>
    </Shell>
  );
}

function ReplyBox({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface p-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = text.trim();
        if (!next) return;
        onSend(next);
        setText("");
      }}
    >
      <label className="sr-only" htmlFor="seller-reply">
        Reply
      </label>
      <input
        id="seller-reply"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a reply"
        className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-sm"
      />
      <button type="submit" className="glow-hover min-h-11 shrink-0 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
        Send
      </button>
    </form>
  );
}

function MessageRow({
  message,
  name,
  preview,
  photo,
  thumb,
  glow,
}: {
  message: AdMessage;
  name: string;
  preview: string;
  photo?: string;
  thumb?: string;
  glow: boolean;
}) {
  return (
    <li>
      <Link
        to="/inbox"
        search={{ open: message.id }}
        className="flex items-center gap-3 py-3"
      >
        <PersonFace name={name} photo={photo} glow={glow} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={`truncate ${glow ? "font-bold" : "font-medium"}`}>{name}</span>
            <span className="shrink-0 text-xs text-muted">{when(message.createdAt)}</span>
          </span>
          <span className={`mt-0.5 block truncate text-sm ${glow ? "text-fg" : "text-muted"}`}>{preview}</span>
        </span>
        {thumb ? <img src={thumb} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" /> : null}
      </Link>
    </li>
  );
}

function PersonFace({ name, photo, glow = false }: { name: string; photo?: string; glow?: boolean }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts.length > 1 ? parts.slice(0, 2) : parts).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
  const glowClass = glow ? "shadow-[0_0_12px_3px_rgba(34,197,94,0.9)] ring-2 ring-[#22c55e]" : "";
  if (photo) return <img src={photo} alt="" className={`h-14 w-14 shrink-0 rounded-full object-cover ${glowClass}`} />;
  return (
    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#bfdbfe] text-sm font-bold text-[#1e3a8a] ${glowClass}`}>
      {letters}
    </span>
  );
}

function when(time: number) {
  const mins = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(time).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
