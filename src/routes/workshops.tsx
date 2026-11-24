import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/shell";
import { CarArt } from "@/components/car-art";
import { ServiceDialog } from "@/components/ad-dialog";
import { useMarket } from "@/components/market-provider";
import { readState, setIntent } from "@/lib/market/store";
import { CITIES, FEATURED_OFFERS, STATES } from "@/lib/market/data";
import { featureFirst, widen } from "@/lib/market/widen";

type WorkshopsSearch = { state?: string; open?: string; panel?: string; notice?: string };

export const Route = createFileRoute("/workshops")({
  validateSearch: (search: Record<string, unknown>): WorkshopsSearch => {
    const next: WorkshopsSearch = {};
    if (typeof search.state === "string" && search.state) next.state = search.state;
    if (typeof search.open === "string" && search.open) next.open = search.open;
    if (typeof search.panel === "string" && search.panel) next.panel = search.panel;
    if (typeof search.notice === "string" && search.notice) next.notice = search.notice;
    return next;
  },
  component: WorkshopsPage,
});

function WorkshopsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { services, user } = useMarket();
  const [stateFilter, setStateFilter] = useState(search.state ?? "");
  const [cityFilter, setCityFilter] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notice, setNotice] = useState(search.notice ?? "");
  const [active, setActive] = useState<{ id: string; contact: boolean; flag: boolean } | null>(null);

  useEffect(() => {
    if (search.state) setStateFilter(search.state);
    setNotice(search.notice ?? "");
  }, [search.state, search.notice]);

  useEffect(() => {
    if (!search.open?.startsWith("service:")) return;
    const id = search.open.slice(8);
    if (!id) return;
    const signedIn = Boolean(readState().user);
    setActive({ id, contact: search.panel === "contact" && signedIn, flag: search.panel === "flag" && signedIn });
  }, [search.open, search.panel, user]);

  const cities = useMemo(() => {
    const fromAds = services.filter((service) => !stateFilter || service.state === stateFilter).map((service) => service.city);
    const known = stateFilter ? (CITIES[stateFilter] ?? []) : Object.values(CITIES).flat();
    return [...new Set([...known, ...fromAds])].sort();
  }, [services, stateFilter]);

  const pool = services.filter((service) => service.review !== "pending");
  const typeOk = (service: (typeof pool)[number], relaxType: boolean) => {
    if (relaxType || !serviceType) return true;
    if (serviceType === "Mechanical") return service.serviceType === "Mechanical" || service.serviceType === "Both";
    if (serviceType === "Panel") return service.serviceType === "Panel" || service.serviceType === "Both";
    if (serviceType === "Both") return service.serviceType === "Both";
    return true;
  };
  const matches = (service: (typeof pool)[number], relax: { state?: boolean; city?: boolean; type?: boolean }) => {
    if (!relax.state && stateFilter && service.state !== stateFilter) return false;
    if (!relax.city && cityFilter && service.city !== cityFilter) return false;
    return typeOk(service, Boolean(relax.type));
  };
  const steps = [{ label: "", pass: (service: (typeof pool)[number]) => matches(service, {}) }];
  if (cityFilter) steps.push({ label: stateFilter ? "Also in this state" : "Other cities", pass: (service) => matches(service, { city: true }) });
  if (serviceType) steps.push({ label: "Other services", pass: (service) => matches(service, { city: true, type: true }) });
  if (stateFilter) steps.push({ label: "Other states", pass: (service) => matches(service, { city: true, type: true, state: true }) });
  if (steps.length > 1) steps.push({ label: "More workshops", pass: () => true });
  const groups = featureFirst(widen(pool, steps), FEATURED_OFFERS, "workshops");
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  const openService = active ? services.find((service) => service.id === active.id) : undefined;

  function allowContact(id: string) {
    if (readState().user) return true;
    setIntent({ kind: "contact", id });
    void navigate({ to: "/login" });
    return false;
  }

  function closeDialog() {
    setActive(null);
    if (search.open || search.panel) {
      void navigate({ to: "/workshops", search: stateFilter ? { state: stateFilter } : {}, replace: true });
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
        <h1 className="text-2xl font-bold text-accent">EV workshops</h1>
        <p className="mt-1 text-sm text-muted">Mechanical specialists and panel repairers who work on electric vehicles. Filter by state, city and service.</p>
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
            aria-label="Service state"
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
          <select aria-label="Service city" className="min-h-11 rounded-md border border-border bg-bg px-3" value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">All cities</option>
            {cities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select aria-label="Service options" className="min-h-11 rounded-md border border-border bg-bg px-3" value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
            <option value="">All services</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Panel">Panel repair</option>
            <option value="Both">Mechanical + Panel</option>
          </select>
          <button
            type="button"
            className="min-h-11 px-3 text-sm text-muted"
            onClick={() => {
              setServiceType("");
              setStateFilter("");
              setCityFilter("");
            }}
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-sm text-muted">{shown} workshops</p>
        {groups.map((group) => (
          <div key={group.label || "closest"} className="mt-4">
            {group.label ? <h2 className="mb-3 text-lg font-semibold">{group.label}</h2> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((service) => (
            <article key={service.id} className="overflow-hidden rounded-md border border-border bg-surface">
              <button type="button" className="block w-full text-left" onClick={() => setActive({ id: service.id, contact: false, flag: false })}>
                {service.photos[0] ? <img src={service.photos[0]} alt="" className="aspect-video w-full object-cover" /> : <CarArt make="Other" frame={1} />}
                <div className="p-4">
                  <h2 className="font-semibold">{service.name}</h2>
                  <p className="text-sm text-muted">{service.serviceType}</p>
                  <p className="mt-1 text-sm text-muted">{service.note}</p>
                  <p className="text-sm text-muted">
                    {service.city}, {service.state}
                  </p>
                </div>
              </button>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  className="contact-glow glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
                  onClick={() => {
                    if (allowContact(service.id)) setActive({ id: service.id, contact: true, flag: false });
                  }}
                >
                  Contact
                </button>
              </div>
            </article>
              ))}
            </div>
          </div>
        ))}
        {shown === 0 ? <p className="mt-4 text-sm text-muted">No workshops listed yet.</p> : null}
        <button type="button" onClick={placeAd} className="glow-hover mt-6 inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold">
          List your workshop
        </button>
      </main>
      {openService && active ? (
        <ServiceDialog service={openService} showContact={active.contact} startFlag={active.flag} onClose={closeDialog} onContact={() => allowContact(openService.id)} />
      ) : null}
    </Shell>
  );
}
