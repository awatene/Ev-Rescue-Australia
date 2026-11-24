import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { CarDialog } from "@/components/ad-dialog";
import { FrameCycle } from "@/components/car-art";
import { useMarket } from "@/components/market-provider";
import { readState, setIntent } from "@/lib/market/store";
import { CITIES, E_MOTO_MAKES, FEATURED_OFFERS, STATES, money } from "@/lib/market/data";
import { featureFirst, widen } from "@/lib/market/widen";

type EbikeSearch = { open?: string; panel?: string; notice?: string };

export const Route = createFileRoute("/ebikes")({
  validateSearch: (search: Record<string, unknown>): EbikeSearch => {
    const next: EbikeSearch = {};
    if (typeof search.open === "string" && search.open) next.open = search.open;
    if (typeof search.panel === "string" && search.panel) next.panel = search.panel;
    if (typeof search.notice === "string" && search.notice) next.notice = search.notice;
    return next;
  },
  component: EbikesPage,
});

function EbikesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { cars, user } = useMarket();
  const [openId, setOpenId] = useState("");
  const [notice, setNotice] = useState(search.notice ?? "");
  const [make, setMake] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listed = cars.filter((car) => (car.ebike || car.id.startsWith("ebike-")) && car.review !== "pending");
  const makes = useMemo(() => [...new Set([...E_MOTO_MAKES, ...listed.map((bike) => bike.make)])].sort((a, b) => a.localeCompare(b)), [listed]);
  const cities = useMemo(() => {
    const fromAds = listed.filter((bike) => !stateFilter || bike.state === stateFilter).map((bike) => bike.city);
    const known = stateFilter ? (CITIES[stateFilter] ?? []) : Object.values(CITIES).flat();
    return [...new Set([...known, ...fromAds])].sort();
  }, [listed, stateFilter]);
  const matches = (bike: (typeof listed)[number], relax: { make?: boolean; state?: boolean; city?: boolean }) => {
    if (!relax.make && make && bike.make !== make) return false;
    if (!relax.state && stateFilter && bike.state !== stateFilter) return false;
    if (!relax.city && cityFilter && bike.city !== cityFilter) return false;
    return true;
  };
  const steps = [{ label: "", pass: (bike: (typeof listed)[number]) => matches(bike, {}) }];
  if (cityFilter) steps.push({ label: stateFilter ? "Also in this state" : "Other cities", pass: (bike) => matches(bike, { city: true }) });
  if (make) steps.push({ label: "Other makes", pass: (bike) => matches(bike, { city: true, make: true }) });
  if (stateFilter) steps.push({ label: "Other states", pass: (bike) => matches(bike, { city: true, make: true, state: true }) });
  if (steps.length > 1) steps.push({ label: "More eBikes", pass: () => true });
  const groups = featureFirst(widen(listed, steps), FEATURED_OFFERS, "ebikes");
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);
  const filterCount = [make, stateFilter, cityFilter].filter(Boolean).length;
  const open = listed.find((car) => car.id === openId) ?? cars.find((car) => car.id === openId);

  useEffect(() => {
    setNotice(search.notice ?? "");
  }, [search.notice]);

  useEffect(() => {
    if (!search.open?.startsWith("car:")) return;
    const id = search.open.slice(4);
    if (id) setOpenId(id);
  }, [search.open, user]);

  function allowMessage(id: string) {
    if (readState().user) return true;
    setIntent({ kind: "message", target: "car", id });
    void navigate({ to: "/login" });
    return false;
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-accent">eBikes for sale</h1>
        <p className="mt-1 text-sm text-muted">Used electric bikes from private sellers and dealers.</p>
        {notice === "listed" ? (
          <p className="mt-4 rounded-md border border-accent bg-bg px-4 py-3 text-sm" role="status">
            Your ad is live.
            <button type="button" className="feature-btn glow-hover ml-3 min-h-11 px-3 text-sm" onClick={() => setNotice("")}>
              Dismiss
            </button>
          </p>
        ) : null}
        <div className="mt-4">
          <button
            type="button"
            className="glow-hover min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filters{filterCount ? ` (${filterCount})` : ""}
          </button>
          {filtersOpen ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                aria-label="Make"
                className="min-h-11 rounded-md border border-border bg-bg px-3"
                value={make}
                onChange={(event) => setMake(event.target.value)}
              >
                <option value="">All makes</option>
                {makes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <select
                aria-label="State"
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
              <select aria-label="City" className="min-h-11 rounded-md border border-border bg-bg px-3" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
                <option value="">All cities</option>
                {cities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <button
                type="button"
                className="min-h-11 rounded-md px-3 text-sm text-muted"
                onClick={() => {
                  setMake("");
                  setStateFilter("");
                  setCityFilter("");
                }}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted">{shown} eBikes</p>
        {shown === 0 ? <p className="mt-4 text-sm text-muted">No eBikes listed yet.</p> : null}
        {groups.map((group) => (
          <div key={group.label || "closest"} className="mt-4">
            {group.label ? <h2 className="mb-3 text-lg font-semibold">{group.label}</h2> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((bike) => (
            <article key={bike.id} className="cursor-pointer overflow-hidden rounded-md border border-border bg-surface" onClick={() => setOpenId(bike.id)}>
              <FrameCycle make={bike.make} photos={bike.photos} onOpen={() => setOpenId(bike.id)} />
              <div className="p-4">
                <h2 className="font-semibold">
                  {bike.year} {bike.make}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{bike.note}</p>
                <p className="text-sm text-muted">
                  {new Intl.NumberFormat("en-AU").format(bike.km)} hours · {bike.city}, {bike.state}
                </p>
                <p className="mt-1 font-semibold text-accent">{money(bike.price)}</p>
              </div>
            </article>
              ))}
            </div>
          </div>
        ))}
      </main>
      {open ? (
        <CarDialog
          car={open}
          startMessage={search.panel === "message" && Boolean(user)}
          startLookup={false}
          startReport={false}
          onClose={() => {
            setOpenId("");
            if (search.open) void navigate({ to: "/ebikes", search: {}, replace: true });
          }}
          onMessage={() => allowMessage(open.id)}
          onOpenPart={(id) => {
            void navigate({ to: "/parts", search: { open: `part:${id}` } });
          }}
        />
      ) : null}
    </Shell>
  );
}
