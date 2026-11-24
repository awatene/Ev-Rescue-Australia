import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Battery, BadgeDollarSign, Wrench, Zap } from "lucide-react";
import { Shell } from "@/components/shell";
import { Logo } from "@/components/logo";
import { useMarket } from "@/components/market-provider";
import { CarArt } from "@/components/car-art";
import { CarDialog } from "@/components/ad-dialog";
import { WriteOffTag } from "@/components/write-off-tag";
import { readState, setIntent } from "@/lib/market/store";
import { FEATURED_OFFERS, money } from "@/lib/market/data";
import { randomFeatured } from "@/lib/market/widen";
import type { HomeSearch } from "@/lib/market/types";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const next: HomeSearch = {};
    if (typeof search.open === "string" && search.open) next.open = search.open;
    if (search.panel === "message" || search.panel === "contact" || search.panel === "battery" || search.panel === "report" || search.panel === "flag") next.panel = search.panel;
    if (typeof search.state === "string" && search.state) next.state = search.state;
    if (typeof search.make === "string" && search.make) next.make = search.make;
    if (typeof search.model === "string" && search.model) next.model = search.model;
    if (typeof search.notice === "string" && search.notice) next.notice = search.notice;
    if (search.focus === "cars" || search.focus === "parts" || search.focus === "services") next.focus = search.focus;
    return next;
  },
  component: HomePage,
});

type Active =
  | { kind: "car"; id: string; message: boolean; lookup: boolean; report: boolean; flag?: boolean }
  | { kind: "part"; id: string; message: boolean; lookup: boolean; report: boolean; flag?: boolean }
  | { kind: "service"; id: string; contact: boolean; flag?: boolean }
  | null;

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { cars, parts, services, user } = useMarket();
  const [active, setActive] = useState<Active>(null);
  const [notice, setNotice] = useState(search.notice ?? "");

  useEffect(() => {
    setNotice(search.notice ?? "");
  }, [search.notice]);

  useEffect(() => {
    if (search.focus === "parts" || search.open?.startsWith("part:")) {
      void navigate({
        to: "/parts",
        search: {
          ...(search.state ? { state: search.state } : {}),
          ...(search.make ? { make: search.make } : {}),
          ...(search.model ? { model: search.model } : {}),
          ...(search.open ? { open: search.open } : {}),
          ...(search.panel ? { panel: search.panel } : {}),
          ...(search.notice ? { notice: search.notice } : {}),
        },
      });
      return;
    }
    if (search.focus === "services" || search.open?.startsWith("service:")) {
      void navigate({
        to: "/workshops",
        search: {
          ...(search.state ? { state: search.state } : {}),
          ...(search.open ? { open: search.open } : {}),
          ...(search.panel ? { panel: search.panel } : {}),
          ...(search.notice ? { notice: search.notice } : {}),
        },
      });
      return;
    }
    if (search.focus === "cars") {
      void navigate({ to: "/cars", search: search.state ? { state: search.state, notice: search.notice } : {} });
    }
  }, [search.state, search.focus, search.make, search.model, search.notice, navigate]);

  useEffect(() => {
    if (!search.open) return;
    const [kind, id] = search.open.split(":");
    if (!id) return;
    const signedIn = Boolean(readState().user);
    if (kind === "car") {
      const car = cars.find((item) => item.id === id);
      if (car?.ebike || id.startsWith("ebike-")) {
        void navigate({ to: "/ebikes", search: { open: search.open, ...(search.panel ? { panel: search.panel } : {}) } });
        return;
      }
      setActive({ kind: "car", id, message: search.panel === "message" && signedIn, lookup: search.panel === "battery" && signedIn, report: search.panel === "report" && signedIn, flag: search.panel === "flag" && signedIn });
    }
    if (kind === "service") {
      void navigate({ to: "/workshops", search: { open: search.open, ...(search.panel ? { panel: search.panel } : {}) } });
    }
    if (kind === "part") {
      void navigate({ to: "/parts", search: { open: search.open, ...(search.panel ? { panel: search.panel } : {}) } });
    }
  }, [search.open, search.panel, user, cars, navigate]);

  const spotlight = useMemo(() => {
    const pool = [
      ...cars
        .filter((car) => car.review !== "pending" && !car.ebike && !car.id.startsWith("ebike-") && !car.id.startsWith("emoto-"))
        .map((item) => ({ kind: "car" as const, item })),
      ...cars
        .filter((car) => car.review !== "pending" && (car.ebike || car.id.startsWith("ebike-")))
        .map((item) => ({ kind: "ebike" as const, item })),
      ...parts.filter((part) => part.review !== "pending").map((item) => ({ kind: "part" as const, item })),
      ...services.filter((service) => service.review !== "pending").map((item) => ({ kind: "service" as const, item })),
    ];
    const mix = (id: string) => {
      let n = 0;
      for (const ch of id) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
      return n;
    };
    return pool.sort((a, b) => mix(`${a.kind}${a.item.id}`) - mix(`${b.kind}${b.item.id}`));
  }, [cars, parts, services]);

  const featured = useMemo(() => {
    const pool = [
      ...cars
        .filter((car) => car.featured && car.review !== "pending" && !car.ebike && !car.id.startsWith("ebike-") && !car.id.startsWith("emoto-"))
        .map((item) => ({ kind: "car" as const, item })),
      ...cars
        .filter((car) => car.featured && car.review !== "pending" && (car.ebike || car.id.startsWith("ebike-")))
        .map((item) => ({ kind: "ebike" as const, item })),
      ...parts.filter((part) => part.featured && part.review !== "pending").map((item) => ({ kind: "part" as const, item })),
      ...services.filter((service) => service.featured && service.review !== "pending").map((item) => ({ kind: "service" as const, item })),
    ];
    const order = randomFeatured(
      pool.map((entry) => ({ id: `${entry.kind}-${entry.item.id}` })),
      "home",
    ).map((entry) => entry.id);
    const byId = new Map(pool.map((entry) => [`${entry.kind}-${entry.item.id}`, entry]));
    return order.map((id) => byId.get(id)).filter((entry): entry is (typeof pool)[number] => Boolean(entry));
  }, [cars, parts, services]);

  function allowMessage(target: "car" | "part", id: string) {
    if (readState().user) return true;
    setIntent({ kind: "message", target, id });
    void navigate({ to: "/login" });
    return false;
  }

  function closeDialog() {
    setActive(null);
    if (search.open || search.panel) {
      void navigate({
        to: "/",
        search: {},
        replace: true,
      });
    }
  }

  const openCar = active?.kind === "car" ? cars.find((car) => car.id === active.id) : undefined;

  return (
    <Shell>
      <section className="relative flex h-[calc(100svh-16.5rem)] overflow-hidden border-b border-border md:h-[calc(100svh-9.5rem)]">
        <img src="/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover brightness-[0.3]" />
        <div className="relative mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col items-center justify-center px-4 py-2 text-center">
          <p className="shrink-0 text-xs font-semibold tracking-wide text-accent uppercase [text-shadow:0_0_14px_rgba(34,197,94,0.45)] md:text-xl md:tracking-widest">Australia’s EV second-life marketplace</p>
          <div className="my-1 flex min-h-0 w-full flex-1 items-center justify-center">
            <Logo className="logo-glow h-full max-h-full w-auto object-contain" />
          </div>
          <h1 className="mt-1 shrink-0 text-4xl font-extrabold tracking-tight text-fg md:text-6xl">EV marketplace</h1>
          <p className="mx-auto mt-1 line-clamp-2 max-w-xl shrink-0 text-xs text-fg md:text-sm">
            Buy and sell used electric vehicles, parts and find local EV mechanics.
          </p>
          <div className="mt-2 flex shrink-0 flex-wrap justify-center gap-3">
            <Link to="/cars" className="glow-hover inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
              Browse EVs
            </Link>
          </div>
          {notice ? (
            <p className="mt-4 max-w-xl rounded-md border border-accent bg-black/70 px-4 py-3 text-sm text-fg" role="status">
              Your ad is live.
              {notice === "featured"
                ? " It is in the featured strip. Card numbers were not stored. A real charge starts when PayPal is connected."
                : ""}
              <button type="button" className="feature-btn glow-hover ml-3 min-h-11 px-3 text-sm" onClick={() => setNotice("")}>
                Dismiss
              </button>
            </p>
          ) : null}
        </div>
      </section>

      {FEATURED_OFFERS && featured.length ? (
      <section className="mx-auto max-w-6xl px-4 py-8" aria-label="Featured ads">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold">Featured</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
            {featured.map((entry) => {
              const title =
                entry.kind === "car" || entry.kind === "ebike"
                  ? `${entry.item.year} ${entry.item.make} ${entry.kind === "ebike" ? "" : entry.item.model}`.trim()
                  : entry.kind === "part"
                    ? entry.item.title
                    : entry.item.name;
              const place = `${entry.item.city}, ${entry.item.state}`;
              const priceLabel = entry.kind === "service" ? entry.item.serviceType : money(entry.item.price);
              return (
                <button
                  key={`${entry.kind}-${entry.item.id}`}
                  type="button"
                  className="w-64 shrink-0 overflow-hidden rounded-md border border-border bg-surface text-left"
                  onClick={() => {
                    if (entry.kind === "car") setActive({ kind: "car", id: entry.item.id, message: false, lookup: false, report: false });
                    if (entry.kind === "ebike") void navigate({ to: "/ebikes", search: { open: `car:${entry.item.id}` } });
                    if (entry.kind === "part") void navigate({ to: "/parts", search: { open: `part:${entry.item.id}` } });
                    if (entry.kind === "service") void navigate({ to: "/workshops", search: { open: `service:${entry.item.id}` } });
                  }}
                >
                  <div className="relative">
                    {entry.item.photos[0] ? (
                      <img src={entry.item.photos[0]} alt="" className="aspect-video w-full object-cover" />
                    ) : (
                      <CarArt make={entry.kind === "service" ? "Other" : entry.item.make} frame={0} />
                    )}
                    {entry.kind === "car" && entry.item.writeoff ? (
                      <WriteOffTag className="absolute top-2 left-2" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-accent">Featured</p>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted">{place}</p>
                    <p className="text-sm font-semibold">{priceLabel}</p>
                  </div>
                </button>
              );
            })}
        </div>
      </section>
      ) : null}

      <section id="why" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold">Why list on EV Rescue</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { Icon: Zap, title: "EV buyers only", text: "No petrol or diesel traffic. People here are looking for second-hand EVs, including repaired write-offs." },
                { Icon: BadgeDollarSign, title: "Free ads", text: FEATURED_OFFERS ? "Place an ad at no cost. A featured spot on the home page and at the top of the ad pages is a paid option." : "Place an ad at no cost. Paid featuring is not on yet." },
                { Icon: Battery, title: "Battery & write-off focus", text: "Buyers can check battery longevity and a PPSR accident report. Built for repaired write-off EVs." },
                { Icon: Wrench, title: "Parts and workshops together", text: "List parts or advertise your EV workshop alongside the cars." },
              ] as const
            ).map((item) => (
              <article key={item.title} className="rounded-md border border-border bg-bg p-4">
                <item.Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border" aria-label="Ads">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-2xl font-bold">On EV Rescue</h2>
          <p className="mt-1 text-sm text-muted">Swipe sideways through EVs, eBikes, parts and workshops.</p>
          {spotlight.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No ads yet.</p>
          ) : (
            <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {spotlight.map((entry) => {
                const title =
                  entry.kind === "car" || entry.kind === "ebike"
                    ? `${entry.item.year} ${entry.item.make} ${entry.kind === "ebike" ? "" : entry.item.model}`.trim()
                    : entry.kind === "part"
                      ? entry.item.title
                      : entry.item.name;
                const place = `${entry.item.city}, ${entry.item.state}`;
                const priceLabel = entry.kind === "service" ? entry.item.serviceType : money(entry.item.price);
                const label = entry.kind === "car" ? "EV" : entry.kind === "ebike" ? "eBike" : entry.kind === "part" ? "EV part" : "EV workshop";
                const photo = entry.item.photos[0];
                return (
                  <button
                    key={`${entry.kind}-${entry.item.id}`}
                    type="button"
                    className="w-[78%] max-w-sm shrink-0 snap-center overflow-hidden rounded-md border border-border bg-bg text-left sm:w-72"
                    onClick={() => {
                      if (entry.kind === "car") setActive({ kind: "car", id: entry.item.id, message: false, lookup: false, report: false });
                      if (entry.kind === "ebike") void navigate({ to: "/ebikes", search: { open: `car:${entry.item.id}` } });
                      if (entry.kind === "part") void navigate({ to: "/parts", search: { open: `part:${entry.item.id}` } });
                      if (entry.kind === "service") void navigate({ to: "/workshops", search: { open: `service:${entry.item.id}` } });
                    }}
                  >
                    <div className="relative">
                      {photo ? <img src={photo} alt="" className="aspect-video w-full object-cover" /> : <CarArt make={entry.kind === "service" ? "Other" : entry.item.make} frame={0} />}
                      {entry.kind === "car" && entry.item.writeoff ? <WriteOffTag className="absolute top-2 left-2" /> : null}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-accent">{label}</p>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-muted">{place}</p>
                      <p className="text-sm font-semibold">{priceLabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="longevity" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold">Longevity after warranty</h2>
          <p className="mt-1 text-muted">Modern EV batteries are built to last well beyond the warranty.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["15–20 years", "Typical lifespan under normal use"],
              ["1–2% per year", "Usual battery wear"],
              ["Over 80%", "Capacity after 200,000 km"],
              ["Up to 804,000 km", "What Tesla modules are designed for"],
            ].map(([title, text]) => (
              <div key={title} className="rounded-md border border-border bg-bg p-4">
                <p className="text-lg font-bold">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-md border border-border p-4">
              <h3 className="font-semibold">What helps batteries last</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>Use slower home charging more than fast charging</li>
                <li>Keep the battery between 20–80% most of the time</li>
                <li>Avoid extreme heat or cold when you can</li>
              </ul>
            </article>
            <article className="rounded-md border border-border p-4">
              <h3 className="font-semibold">Battery replacement is rare</h3>
              <p className="mt-2 text-sm text-muted">
                Full battery replacement is rare — about 0.3% of cars from 2022 onward. A used pack often costs less
                than a second-hand petrol engine, and an EV mechanic can fit it. That is how an EV becomes a forever
                car.
              </p>
            </article>
            <article className="rounded-md border border-border p-4">
              <h3 className="font-semibold">Comfort, safety, technology</h3>
              <p className="mt-2 text-sm text-muted">
                These cars already have strong comfort, safety and technology. Monthly software updates keep improving
                the car you bought, so many owners see no need to change models every few years.
              </p>
            </article>
          </div>
        </div>
      </section>

      {openCar && active?.kind === "car" ? (
        <CarDialog
          car={openCar}
          startMessage={active.message}
          startLookup={active.lookup}
          startReport={active.report}
          startFlag={Boolean(active.flag)}
          onClose={closeDialog}
          onLookupStarted={() => {
            if (search.panel !== "battery") return;
            void navigate({
              to: "/",
              search: { open: `car:${openCar.id}` },
              replace: true,
            });
          }}
          onReportStarted={() => {
            if (search.panel !== "report") return;
            void navigate({
              to: "/",
              search: { open: `car:${openCar.id}` },
              replace: true,
            });
          }}
          onMessage={() => allowMessage("car", openCar.id)}
          onOpenPart={(id) => {
            void navigate({ to: "/parts", search: { open: `part:${id}` } });
          }}
        />
      ) : null}
    </Shell>
  );
}
