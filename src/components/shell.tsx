import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { useMarket } from "@/components/market-provider";
import { readState } from "@/lib/market/store";
import { signOut as endSession } from "@/lib/auth/client";
import { SITE_EMAIL } from "@/lib/market/data";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts.length > 1 ? parts.slice(0, 2) : parts).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pb-44 md:pb-0">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function SiteHeader() {
  const { user, messages, cars, parts, services, flags, signOut, setIntent } = useMarket();
  const navigate = useNavigate();
  const mine = user
    ? messages.filter((message) => {
        const email = user.email.toLowerCase();
        if (message.sellerEmail.toLowerCase() === email && !message.read) return true;
        if (message.buyerEmail.toLowerCase() !== email || !message.reply || typeof window === "undefined") return false;
        const seen = Number(window.localStorage.getItem(`evrescue.reply-seen.${message.id}`) || 0);
        return (message.replyAt || message.createdAt) > seen;
      })
    : [];
  const messageCount = mine.length;
  const latestMessage = [...mine].sort((a, b) => b.createdAt - a.createdAt)[0];
  const isAdmin = user?.email.toLowerCase() === SITE_EMAIL;
  const pendingCar = isAdmin ? cars.find((car) => car.review === "pending") : undefined;
  const pendingPart = isAdmin ? parts.find((part) => part.review === "pending") : undefined;
  const pendingService = isAdmin ? services.find((service) => service.review === "pending") : undefined;
  const openReport = isAdmin ? flags.find((flag) => flag.status === "open") : undefined;
  const held = isAdmin
    ? cars.filter((car) => car.review === "pending").length +
      parts.filter((part) => part.review === "pending").length +
      services.filter((service) => service.review === "pending").length +
      flags.filter((flag) => flag.status === "open").length
    : 0;
  const heldOpen = pendingCar
    ? `car:${pendingCar.id}`
    : pendingPart
      ? `part:${pendingPart.id}`
      : pendingService
        ? `service:${pendingService.id}`
        : openReport
          ? `${openReport.kind}:${openReport.adId}`
          : "";
  const [logoOn, setLogoOn] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const clickTimer = useRef<number | null>(null);

  function onLogoClick(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      void navigate({ to: "/" });
    }, 280);
  }

  function onLogoDoubleClick(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    setLogoOn(true);
  }

  useEffect(() => {
    if (!logoOn) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  }, [logoOn]);

  function closeLogo() {
    videoRef.current?.pause();
    setLogoOn(false);
  }

  function placeAd() {
    if (!readState().user) {
      setIntent({ kind: "list" });
      void navigate({ to: "/login" });
      return;
    }
    void navigate({ to: "/list" });
  }

  const account = user ? (
    <>
      <div className="flex max-w-28 flex-col items-center">
        <span className="relative">
          <Link to="/profile" aria-label={`${user.name}, open profile`} className="inline-flex origin-center transition-transform md:hover:scale-150">
            {user.photo ? (
              <img src={user.photo} alt="" className="h-[1.6875rem] w-[1.6875rem] rounded-full object-cover" />
            ) : (
              <span className="flex h-[1.6875rem] w-[1.6875rem] items-center justify-center rounded-full bg-[#bfdbfe] text-[10px] font-bold text-[#1e3a8a]">
                {initials(user.name)}
              </span>
            )}
          </Link>
          {messageCount > 0 ? (
            <Link
              to="/inbox"
              search={latestMessage ? { open: latestMessage.id } : {}}
              className="absolute top-0 right-0 z-20 flex h-5 min-w-5 origin-center items-center justify-center rounded-full border border-[#dc2626] bg-[#f59e0b] px-1 text-[10px] font-extrabold leading-none text-[#1c1917] transition-transform hover:scale-150"
              aria-label={latestMessage ? `Open message from ${latestMessage.buyerName}` : `${messageCount} messages`}
            >
              {messageCount}
            </Link>
          ) : null}
        </span>
        <Link to="/profile" className="mt-0.5 hidden max-w-28 truncate text-xs text-muted md:block">
          {user.name}
        </Link>
      </div>
      <button
        type="button"
        className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold"
        onClick={() => setConfirmSignOut(true)}
      >
        Sign out
      </button>
    </>
  ) : (
    <Link to="/login" className="glow-hover inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold">
      Sign in
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
        {held > 0 ? (
          <Link to="/admin" search={heldOpen ? { open: heldOpen } : {}} className="block bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-ink">
            {held} held {held === 1 ? "ad needs" : "ads need"} a check. A note was sent to admin@ev-rescue-au.com.au.
          </Link>
        ) : null}
        <div className="flex items-center gap-2 px-3 py-2 md:hidden">
          <a href="/" className="logo-glow flex shrink-0 items-center" onClick={onLogoClick} onDoubleClick={onLogoDoubleClick}>
            <Logo className="h-[4.6875rem] w-auto" />
          </a>
          <div className="ml-auto flex items-center gap-2">{account}</div>
        </div>
        <div className="relative mx-auto hidden max-w-6xl items-center gap-3 px-4 py-2 md:flex">
          <a href="/" className="logo-glow flex shrink-0 items-center" onClick={onLogoClick} onDoubleClick={onLogoDoubleClick}>
            <Logo className="h-[6.5625rem] w-auto md:h-[7.5rem]" />
          </a>
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Link to="/" className="buy-link text-sm font-semibold">
              Home
            </Link>
            <Link to="/cars" className="buy-link text-sm font-semibold">
              EV's for sale
            </Link>
            <Link to="/ebikes" className="buy-link text-sm font-semibold">
              eBikes for sale
            </Link>
          </nav>
          <div className="flex min-w-0 flex-1 justify-end">
            <button type="button" onClick={placeAd} className="ad-sign mr-8 flex -rotate-6 flex-col items-center" aria-label="Post ad free now">
              <span className="border-2 border-[#dc2626] bg-[#fffaf3] px-2 py-1 text-center text-[11px] font-extrabold leading-none tracking-wide text-[#dc2626] uppercase shadow-[2px_2px_0_#dc2626]">
                Post ad
                <span className="mt-0.5 block">free now</span>
              </span>
              <span className="h-2.5 w-1.5 bg-[#9a3412]" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-2" aria-label="More">
              <Link to="/parts" className="buy-link text-sm font-semibold">
                EV parts
              </Link>
              <Link to="/workshops" className="buy-link text-sm font-semibold">
                EV workshops
              </Link>
              <Link to="/contact" className="buy-link text-sm font-semibold">
                Help
              </Link>
            </nav>
            {account}
          </div>
        </div>
      </header>
      {confirmSignOut ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="sign-out-title">
          <div className="w-full max-w-sm rounded-md border border-border bg-bg p-5">
            <p id="sign-out-title" className="text-lg font-semibold">
              Sign out for sure?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="glow-hover min-h-11 flex-1 rounded-md border border-border text-sm font-semibold"
                onClick={() => setConfirmSignOut(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="glow-hover min-h-11 flex-1 rounded-md bg-accent text-sm font-semibold text-accent-ink"
                onClick={() => {
                  setConfirmSignOut(false);
                  signOut();
                  void endSession("/").catch(() => {
                    window.location.assign("/");
                  });
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        <div className="flex justify-center">
          <button type="button" onClick={placeAd} className="ad-sign flex -rotate-6 flex-col items-center" aria-label="Post ad free now">
            <span className="border-2 border-[#dc2626] bg-[#fffaf3] px-2 py-1 text-center text-[11px] font-extrabold leading-none tracking-wide text-[#dc2626] uppercase shadow-[2px_2px_0_#dc2626]">
              Post ad
              <span className="mt-0.5 block">free now</span>
            </span>
            <span className="h-2 w-1.5 bg-[#9a3412]" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-1">
          <Link to="/" className="buy-link buy-link-compact text-sm font-semibold">
            Home
          </Link>
          <Link to="/cars" className="buy-link buy-link-compact text-sm font-semibold">
            EV's for sale
          </Link>
          <Link to="/ebikes" className="buy-link buy-link-compact text-sm font-semibold">
            eBikes for sale
          </Link>
          <Link to="/parts" className="buy-link buy-link-compact text-sm font-semibold">
            EV parts
          </Link>
          <Link to="/workshops" className="buy-link buy-link-compact text-sm font-semibold">
            EV workshops
          </Link>
          <Link to="/contact" className="buy-link buy-link-compact text-sm font-semibold">
            Help
          </Link>
        </div>
      </nav>
      {logoOn ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 pt-24 pb-28 sm:items-center sm:pt-28" role="dialog" aria-modal="true" aria-label="Logo animation">
          <button type="button" className="absolute top-4 right-4 min-h-11 min-w-11 rounded-md bg-surface text-fg" onClick={closeLogo} aria-label="Close">
            <X className="mx-auto h-5 w-5" />
          </button>
          <video ref={videoRef} src="/logo-animation.mp4" playsInline className="max-h-[70vh] w-full max-w-xl rounded-md object-contain" />
        </div>
      ) : null}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:justify-between">
        <div>
          <div className="logo-glow flex items-center">
          <Logo className="h-[4.5rem] w-auto" />
          </div>
          <a className="mt-2 block text-sm text-muted" href={`mailto:${SITE_EMAIL}`}>
            {SITE_EMAIL}
          </a>
          <p className="mt-2 text-sm text-muted">EV marketplace</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link to="/cars">EVs for sale</Link>
          <Link to="/parts">Parts</Link>
          <Link to="/workshops">Services</Link>
          <Link to="/" hash="longevity">Longevity</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/data-deletion">Delete your data</Link>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted">
          © 2026 EV Rescue Australia. All rights reserved. Demo marketplace — always verify with an official PPSR
          check, request battery health data, and get an independent inspection before you buy. Longevity figures are
          indicative only.
        </p>
      </div>
    </footer>
  );
}
