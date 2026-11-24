import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { FrameCycle } from "@/components/car-art";
import { CarDialog } from "@/components/ad-dialog";
import { WriteOffTag } from "@/components/write-off-tag";
import { useMarket } from "@/components/market-provider";
import { readState, setIntent } from "@/lib/market/store";
import { FEATURED_OFFERS, CITIES, MAKES, MODELS_BY_MAKE, PRICE_OPTIONS, STATES, kmLabel, money, plateClass, plateFont, plateName } from "@/lib/market/data";
import { featureFirst, widen } from "@/lib/market/widen";

type CarsSearch = { state?: string; open?: string; panel?: string; notice?: string };

export const Route = createFileRoute("/cars")({
  validateSearch: (search: Record<string, unknown>): CarsSearch => {
    const next: CarsSearch = {};
    if (typeof search.state === "string" && search.state) next.state = search.state;
    if (typeof search.open === "string" && search.open) next.open = search.open;
    if (typeof search.panel === "string" && search.panel) next.panel = search.panel;
    if (typeof search.notice === "string" && search.notice) next.notice = search.notice;
    return next;
  },
  component: CarsPage,
});

function isVehicle(car: { ebike?: boolean; id: string; review?: string }) {
  return car.review !== "pending" && !car.ebike && !car.id.startsWith("ebike-") && !car.id.startsWith("emoto-");
}

function CarsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { cars, user } = useMarket();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [stateFilter, setStateFilter] = useState(search.state ?? "");
  const [cityFilter, setCityFilter] = useState("");
  const [price, setPrice] = useState("");
  const [writeoff, setWriteoff] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState(search.notice ?? "");
  const [active, setActive] = useState<{ id: string; message: boolean; lookup: boolean; report: boolean; flag: boolean } | null>(null);

  useEffect(() => {
    if (search.state) setStateFilter(search.state);
    setNotice(search.notice ?? "");
  }, [search.state, search.notice]);

  useEffect(() => {
    if (!search.open?.startsWith("car:")) return;
    const id = search.open.slice(4);
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

  const makes = useMemo(() => [...new Set([...MAKES, ...cars.filter(isVehicle).map((car) => car.make)])].sort(), [cars]);
  const models = useMemo(() => {
    const listed = cars.filter((car) => isVehicle(car) && (!make || car.make === make)).map((car) => car.model);
    const known = make ? (MODELS_BY_MAKE[make] ?? []) : Object.values(MODELS_BY_MAKE).flat();
    return [...new Set([...known, ...listed])].sort();
  }, [cars, make]);
  const carCities = useMemo(() => {
    const fromAds = cars.filter((car) => isVehicle(car) && (!stateFilter || car.state === stateFilter)).map((car) => car.city);
    const known = stateFilter ? (CITIES[stateFilter] ?? []) : Object.values(CITIES).flat();
    return [...new Set([...known, ...fromAds])].sort();
  }, [cars, stateFilter]);

  const pool = cars.filter(isVehicle);
  const matches = (car: (typeof pool)[number], relax: { make?: boolean; model?: boolean; state?: boolean; city?: boolean; price?: boolean; writeoff?: boolean }) => {
    if (!relax.make && make && car.make !== make) return false;
    if (!relax.model && model && car.model !== model) return false;
    if (!relax.state && stateFilter && car.state !== stateFilter) return false;
    if (!relax.city && cityFilter && car.city !== cityFilter) return false;
    if (!relax.price && price && car.price > Number(price)) return false;
    if (!relax.writeoff && writeoff && !car.writeoff) return false;
    return true;
  };
  const steps = [{ label: "", pass: (car: (typeof pool)[number]) => matches(car, {}) }];
  if (cityFilter) steps.push({ label: stateFilter ? "Also in this state" : "Other cities", pass: (car) => matches(car, { city: true }) });
  if (model) steps.push({ label: "Other models", pass: (car) => matches(car, { city: true, model: true }) });
  if (make) steps.push({ label: "Other makes", pass: (car) => matches(car, { city: true, model: true, make: true }) });
  if (stateFilter) steps.push({ label: "Other states", pass: (car) => matches(car, { city: true, model: true, make: true, state: true }) });
  if (price) steps.push({ label: "Above that price", pass: (car) => matches(car, { city: true, model: true, make: true, state: true, price: true }) });
  if (writeoff) steps.push({ label: "Other vehicles", pass: () => true });
  else if (steps.length > 1) steps.push({ label: "More vehicles", pass: () => true });
  const groups = featureFirst(widen(pool, steps), FEATURED_OFFERS, "cars");
  const filterCount = [make, model, stateFilter, cityFilter, price, writeoff ? "yes" : ""].filter(Boolean).length;
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  const openCar = active ? cars.find((car) => car.id === active.id) : undefined;

  function allowMessage(id: string) {
    if (readState().user) return true;
    setIntent({ kind: "message", target: "car", id });
    void navigate({ to: "/login" });
    return false;
  }

  function closeDialog() {
    setActive(null);
    if (search.open || search.panel) {
      void navigate({ to: "/cars", search: stateFilter ? { state: stateFilter } : {}, replace: true });
    }
  }

  return (
    <Shell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-accent">EVs for sale</h1>
        <p className="mt-1 text-sm text-muted">Private sellers and dealers. Open a car for battery, motor and parts facts.</p>
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
          <select aria-label="Model" className="min-h-11 rounded-md border border-border bg-bg px-3" value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="">All models</option>
            {models.map((item) => (
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
            {carCities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Maximum price" className="min-h-11 rounded-md border border-border bg-bg px-3" value={price} onChange={(event) => setPrice(event.target.value)}>
            {PRICE_OPTIONS.map((item) => (
              <option key={item.label} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm">
            <input type="checkbox" checked={writeoff} onChange={(event) => setWriteoff(event.target.checked)} />
            Repaired write-off <span className="font-semibold text-accent">value</span>
          </label>
          <button
            type="button"
            className="min-h-11 rounded-md px-3 text-sm text-muted"
            onClick={() => {
              setMake("");
              setModel("");
              setStateFilter("");
              setCityFilter("");
              setPrice("");
              setWriteoff(false);
            }}
          >
            Clear
          </button>
        </div>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-muted">{shown} vehicles</p>
        {groups.map((group) => (
          <div key={group.label || "closest"} className="mt-4">
            {group.label ? <h2 className="mb-3 text-lg font-semibold">{group.label}</h2> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((car) => (
            <article
              key={car.id}
              className="cursor-pointer overflow-hidden rounded-md border border-border bg-surface"
              onClick={() => setActive({ id: car.id, message: false, lookup: false, report: false, flag: false })}
            >
              <div className="relative">
                <FrameCycle make={car.make} photos={car.photos} onOpen={() => setActive({ id: car.id, message: false, lookup: false, report: false, flag: false })} />
                {car.writeoff ? <WriteOffTag className="absolute top-3 left-3" /> : null}
              </div>
              <div className="p-4">
                <h2 className="font-semibold">
                  {car.year} {car.make} {car.model}
                </h2>
                <p className="text-sm text-muted">
                  {kmLabel(car.km)} · {car.seller}
                </p>
                {car.registration ? (
                  <p className={`rego-plate rego-ad mt-2 ${plateClass(car.state)}`}>
                    <span style={{ fontSize: plateFont(car.registration) }}>{car.registration}</span>
                    {plateName(car.state) ? <span className="rego-legend">{plateName(car.state)}</span> : null}
                  </p>
                ) : null}
                <p className="mt-1 font-bold text-accent">{money(car.price)}</p>
                <p className="text-sm text-muted">
                  {car.city}, {car.state}
                </p>
              </div>
            </article>
              ))}
            </div>
          </div>
        ))}
        {shown === 0 ? <p className="mt-4 text-sm text-muted">No EVs listed yet.</p> : null}
      </main>
      {openCar && active ? (
        <CarDialog
          car={openCar}
          startMessage={active.message}
          startLookup={active.lookup}
          startReport={active.report}
          startFlag={active.flag}
          onClose={closeDialog}
          onMessage={() => allowMessage(openCar.id)}
          onOpenPart={(id) => {
            void navigate({ to: "/parts", search: { open: `part:${id}` } });
          }}
        />
      ) : null}
    </Shell>
  );
}
