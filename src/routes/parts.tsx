import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { CarArt } from "@/components/car-art";
import { PartDialog } from "@/components/ad-dialog";
import { useMarket } from "@/components/market-provider";
import { readState, setIntent } from "@/lib/market/store";
import { CITIES, FEATURED_OFFERS, MAKES, MODELS_BY_MAKE, STATES, money } from "@/lib/market/data";
import { featureFirst, widen } from "@/lib/market/widen";

type PartsSearch = { state?: string; make?: string; model?: string; open?: string; panel?: string; notice?: string };

export const Route = createFileRoute("/parts")({
  validateSearch: (search: Record<string, unknown>): PartsSearch => {
    const next: PartsSearch = {};
    if (typeof search.state === "string" && search.state) next.state = search.state;
    if (typeof search.make === "string" && search.make) next.make = search.make;
    if (typeof search.model === "string" && search.model) next.model = search.model;
    if (typeof search.open === "string" && search.open) next.open = search.open;
    if (typeof search.panel === "string" && search.panel) next.panel = search.panel;
    if (typeof search.notice === "string" && search.notice) next.notice = search.notice;
    return next;
  },
  component: PartsPage,
});

function PartsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { parts, user } = useMarket();
  const [make, setMake] = useState(search.make ?? "");
  const [model, setModel] = useState(search.model ?? "");
  const [stateFilter, setStateFilter] = useState(search.state ?? "");
  const [cityFilter, setCityFilter] = useState("");
  const [notice, setNotice] = useState(search.notice ?? "");
  const [active, setActive] = useState<{ id: string; message: boolean; lookup: boolean; report: boolean; flag: boolean } | null>(null);

  useEffect(() => {
    if (search.state) setStateFilter(search.state);
    if (search.make) setMake(search.make);
    if (search.model) setModel(search.model);
    setNotice(search.notice ?? "");
  }, [search.state, search.make, search.model, search.notice]);

  useEffect(() => {
    if (!search.open?.startsWith("part:")) return;
    const id = search.open.slice(5);
    if (!id) return;
    const signedIn = Boolean(readState().user);
    setActive({
      id,
      message: search.panel === "message" && signedIn,
      lookup: search.panel === "battery" && signedIn,
      report: search.panel === "report" && signedIn,
      flag: search.panel === "flag" && signedIn,
    });
  }, [search.open, search.panel, user]);

  const makes = useMemo(() => [...new Set([...MAKES, ...parts.map((part) => part.make)])].sort(), [parts]);
  const models = useMemo(() => {
    const listed = parts.filter((part) => !make || part.make === make).map((part) => part.model);
    const known = make ? (MODELS_BY_MAKE[make] ?? []) : Object.values(MODELS_BY_MAKE).flat();
    return [...new Set([...known, ...listed])].sort();
  }, [parts, make]);
  const cities = useMemo(() => {
    const fromAds = parts.filter((part) => !stateFilter || part.state === stateFilter).map((part) => part.city);
    const known = stateFilter ? (CITIES[stateFilter] ?? []) : Object.values(CITIES).flat();
    return [...new Set([...known, ...fromAds])].sort();
  }, [parts, stateFilter]);

  const pool = parts.filter((part) => part.review !== "pending");
  const matches = (part: (typeof pool)[number], relax: { make?: boolean; model?: boolean; state?: boolean; city?: boolean }) => {
    if (!relax.make && make && part.make !== make) return false;
    if (!relax.model && model && part.model !== model) return false;
    if (!relax.state && stateFilter && part.state !== stateFilter) return false;
    if (!relax.city && cityFilter && part.city !== cityFilter) return false;
    return true;
  };
  const steps = [{ label: "", pass: (part: (typeof pool)[number]) => matches(part, {}) }];
  if (cityFilter) steps.push({ label: stateFilter ? "Also in this state" : "Other cities", pass: (part) => matches(part, { city: true }) });
  if (model) steps.push({ label: "Other models", pass: (part) => matches(part, { city: true, model: true }) });
  if (make) steps.push({ label: "Other makes", pass: (part) => matches(part, { city: true, model: true, make: true }) });
  if (stateFilter) steps.push({ label: "Other states", pass: (part) => matches(part, { city: true, model: true, make: true, state: true }) });
  if (steps.length > 1) steps.push({ label: "More parts", pass: () => true });
  const groups = featureFirst(widen(pool, steps), FEATURED_OFFERS, "parts");
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  const openPart = active ? parts.find((part) => part.id === active.id) : undefined;

  function allowMessage(id: string) {
    if (readState().user) return true;
    setIntent({ kind: "message", target: "part", id });
    void navigate({ to: "/login" });
    return false;
  }

  function closeDialog() {
    setActive(null);
    if (search.open || search.panel) {
      void navigate({ to: "/parts", search: stateFilter ? { state: stateFilter } : {}, replace: true });
    }
  }

  function placeAd() {
    if (!readState().user) {
      setIntent({ kind: "list" });
      void navigate({ to: "/login" });
      return;
    }
    void navigate({ to: "/list" });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-accent">EV parts</h1>
        <p className="mt-1 text-sm text-muted">Spare parts from sellers across Australia. Filter by make, model, state and city.</p>
        {notice === "listed" ? (
          <p className="mt-4 rounded-md border border-accent bg-bg px-4 py-3 text-sm" role="status">
            Your ad is live.
            <button type="button" className="feature-btn glow-hover ml-3 min-h-11 px-3 text-sm" onClick={() => setNotice("")}>
              Dismiss
            </button>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            aria-label="Parts make"
            className="min-h-11 rounded-md border border-border bg-bg px-3"
            value={make}
            onChange={(event) => {
              setMake(event.target.value);
              setModel("");
            }}
          >
            <option value="">All makes</option>
            {makes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Parts model" className="min-h-11 rounded-md border border-border bg-bg px-3" value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="">All models</option>
            {models.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Parts state"
            className="min-h-11 rounded-md border border-border bg-bg px-3"
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value);
              setCityFilter("");
            }}
          >
            <option value="">All states</option>
            {STATES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Parts city" className="min-h-11 rounded-md border border-border bg-bg px-3" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">All cities</option>
            {cities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            type="button"
            className="min-h-11 px-3 text-sm text-muted"
            onClick={() => {
              setMake("");
              setModel("");
              setStateFilter("");
              setCityFilter("");
            }}
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">{shown} parts</p>
        {groups.map((group) => (
          <div key={group.label || "closest"} className="mt-4">
            {group.label ? <h2 className="mb-3 text-lg font-semibold">{group.label}</h2> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((part) => (
            <article
              key={part.id}
              className="cursor-pointer overflow-hidden rounded-md border border-border bg-surface"
              onClick={() => setActive({ id: part.id, message: false, lookup: false, report: false, flag: false })}
            >
              {part.photos[0] ? <img src={part.photos[0]} alt="" className="aspect-video w-full object-cover" /> : <CarArt make={part.make} frame={2} />}
              <div className="p-4">
                <h2 className="font-semibold">{part.title}</h2>
                <p className="text-sm text-muted">{part.make}</p>
                <p className="mt-1 font-bold text-accent">{money(part.price)}</p>
                <p className="text-sm text-muted">
                  {part.city}, {part.state}
                </p>
              </div>
            </article>
              ))}
            </div>
          </div>
        ))}
        {shown === 0 ? <p className="mt-4 text-sm text-muted">No parts listed yet.</p> : null}
        <button type="button" onClick={placeAd} className="glow-hover mt-6 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
          List your parts
        </button>
      </main>
      {openPart && active ? (
        <PartDialog
          part={openPart}
          startMessage={active.message}
          startLookup={active.lookup}
          startFlag={active.flag}
          onClose={closeDialog}
          onMessage={() => allowMessage(openPart.id)}
        />
      ) : null}
    </Shell>
  );
}
