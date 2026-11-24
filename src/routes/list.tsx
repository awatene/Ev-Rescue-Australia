import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Charging } from "@/components/charging";
import { Shell } from "@/components/shell";
import { PhotoPicker } from "@/components/photo-picker";
import { useMarket } from "@/components/market-provider";
import { CITIES, E_MOTO_MAKES, FEATURED_OFFERS, MAKES, MODELS_BY_MAKE, STATES, YEARS, plateClass, plateFont, plateName } from "@/lib/market/data";
import { offensiveLanguage } from "@/lib/market/moderate";
import { notifyAdmin } from "@/lib/market/notify";
import { checkVehiclePhoto } from "@/lib/market/photo-check";
import { readState } from "@/lib/market/store";
import type { Car, Draft, Part, Service, ServiceType, User } from "@/lib/market/types";

export const Route = createFileRoute("/list")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } => {
    const edit = typeof search.edit === "string" ? search.edit : "";
    return /^(car|part|service):[\w-]+$/.test(edit) ? { edit } : {};
  },
  component: ListPage,
});

type ListForm = {
  type: "" | "ev" | "parts" | "service" | "ebike";
  make: string;
  model: string;
  year: string;
  state: string;
  city: string;
  registration: string;
  km: string;
  price: string;
  vin: string;
  description: string;
  writeoff: boolean;
  feature: boolean;
  extra: string;
  lookedUp: boolean;
  lookupNote: string;
  batteryNote: string;
  partMake: string;
  partModel: string;
  partYear: string;
  partState: string;
  partCity: string;
  partDesc: string;
  partPrice: string;
  svcName: string;
  svcType: "" | ServiceType;
  svcState: string;
  svcCity: string;
  svcNote: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  photos: string[];
};

const fieldClass = "min-h-11 w-full rounded-md border border-border bg-bg px-3 text-sm";

function blankForm(user: User): ListForm {
  return {
    type: "ev",
    make: "",
    model: "",
    year: "",
    state: "",
    city: "",
    registration: "",
    km: "",
    price: "",
    vin: "",
    description: "",
    writeoff: false,
    feature: false,
    extra: "",
    lookedUp: false,
    lookupNote: "",
    batteryNote: "",
    partMake: "",
    partModel: "",
    partYear: "",
    partState: "",
    partCity: "",
    partDesc: "",
    partPrice: "",
    svcName: "",
    svcType: "",
    svcState: "",
    svcCity: "",
    svcNote: "",
    contactName: user.name,
    contactEmail: user.email,
    contactPhone: user.phone,
    photos: [],
  };
}

function applyDraft(base: ListForm, draft: Draft): ListForm {
  const next: ListForm = { ...base, photos: draft.photos };
  (Object.keys(base) as (keyof ListForm)[]).forEach((key) => {
    if (key === "photos") return;
    const value = draft.values[key];
    if (typeof next[key] === "boolean" && typeof value === "boolean") {
      (next[key] as boolean) = value;
    } else if (typeof next[key] === "string" && typeof value === "string") {
      (next[key] as string) = value;
    }
  });
  return next;
}

function owned(email: string | undefined, userEmail: string) {
  return Boolean(email) && email!.trim().toLowerCase() === userEmail.trim().toLowerCase();
}

function formFromAd(edit: string, cars: Car[], parts: Part[], services: Service[], user: User): ListForm | null {
  const [kind, id] = edit.split(":");
  const base = blankForm(user);
  if (kind === "car") {
    const car = cars.find((item) => item.id === id && (owned(item.ownerEmail, user.email) || owned(item.contactEmail, user.email)));
    if (!car) return null;
    return {
      ...base,
      type: id.startsWith("ebike-") ? "ebike" : "ev",
      make: car.make,
      model: car.model,
      year: car.year ? String(car.year) : "",
      state: car.state,
      city: car.city,
      registration: car.registration || "",
      km: car.km ? String(car.km) : "",
      price: car.price ? String(car.price) : "",
      vin: car.vin || "",
      description: car.note === "Newly listed vehicle." ? "" : car.note,
      writeoff: car.writeoff,
      feature: car.featured,
      extra: car.specs?.extra || "",
      photos: car.photos,
      contactName: car.contactName || user.name,
      contactEmail: car.contactEmail || user.email,
      contactPhone: car.contactPhone || user.phone,
    };
  }
  if (kind === "part") {
    const part = parts.find((item) => item.id === id && (owned(item.ownerEmail, user.email) || owned(item.contactEmail, user.email)));
    if (!part) return null;
    return {
      ...base,
      type: "parts",
      partMake: part.make,
      partModel: part.model,
      partYear: part.year,
      partState: part.state,
      partCity: part.city,
      partPrice: part.price ? String(part.price) : "",
      partDesc: part.description,
      feature: part.featured,
      photos: part.photos,
      contactName: part.contactName || user.name,
      contactEmail: part.contactEmail || user.email,
      contactPhone: part.contactPhone || user.phone,
    };
  }
  const service = services.find((item) => item.id === id && (owned(item.ownerEmail, user.email) || owned(item.email, user.email)));
  if (!service || kind !== "service") return null;
  return {
    ...base,
    type: "service",
    svcName: service.name,
    svcType: service.serviceType,
    svcState: service.state,
    svcCity: service.city,
    svcNote: service.note === "Newly listed workshop." ? "" : service.note,
    feature: service.featured,
    photos: service.photos,
    contactName: user.name,
    contactEmail: service.email || user.email,
    contactPhone: service.phone || user.phone,
  };
}

function toDraft(form: ListForm): Draft {
  const values: Record<string, string | boolean> = {};
  (Object.keys(form) as (keyof ListForm)[]).forEach((key) => {
    if (key === "photos") return;
    const value = form[key];
    if (typeof value === "string" || typeof value === "boolean") values[key] = value;
  });
  return { savedAt: Date.now(), values, photos: form.photos };
}

function ListPage() {
  const { edit } = Route.useSearch();
  const { ready, user, cars, parts, services, setIntent, addCar, addPart, addService, saveDraft, clearDraft, setPendingPay } = useMarket();
  const navigate = useNavigate();
  const [form, setForm] = useState<ListForm | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [checking, setChecking] = useState(false);
  const [held, setHeld] = useState(false);
  const [vinWhy, setVinWhy] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [wasFeatured, setWasFeatured] = useState(false);
  const [missingAd, setMissingAd] = useState(false);
  const hydrated = useRef(false);
  const saveGen = useRef(0);

  useEffect(() => {
    if (!ready) return;
    if (!readState().user) {
      setIntent({ kind: "list" });
      void navigate({ to: "/login", replace: true });
    }
  }, [ready, user, navigate, setIntent]);

  useEffect(() => {
    if (!ready || !user || hydrated.current) return;
    if (edit) {
      const next = formFromAd(edit, cars, parts, services, user);
      if (!next) return;
      hydrated.current = true;
      setEditingId(edit.slice(edit.indexOf(":") + 1));
      setWasFeatured(next.feature);
      setForm(next);
      setStatus("Editing your ad");
      return;
    }
    hydrated.current = true;
    const draft = readState().draft;
    const base = blankForm(user);
    if (draft) {
      setForm(applyDraft(base, draft));
      setStatus("Draft restored");
    } else {
      setForm(base);
    }
  }, [ready, user, edit, cars, parts, services]);

  useEffect(() => {
    if (!edit || !ready || !user || hydrated.current) return;
    const timer = window.setTimeout(() => {
      if (hydrated.current) return;
      hydrated.current = true;
      setMissingAd(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [edit, ready, user]);

  useEffect(() => {
    if (!form || !user || editingId) return;
    const gen = saveGen.current;
    const timer = window.setTimeout(() => {
      if (gen !== saveGen.current) return;
      saveDraft(toDraft(form));
      setStatus((current) => (current === "Draft restored" ? current : "Draft saved"));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form, user, saveDraft, editingId]);

  if (!ready || !user || !form) {
    return (
      <Shell>
        <main className="mx-auto max-w-3xl px-4 py-10">
          {missingAd ? (
            <p className="text-sm text-muted">
              That ad could not be opened.{" "}
              <a href="/my-ads" className="font-semibold text-accent">
                Back to My ads
              </a>
            </p>
          ) : (
            <Charging label={edit ? "Loading your ad…" : "Loading your account…"} />
          )}
        </main>
      </Shell>
    );
  }

  const cities = CITIES[form.state] ?? [];
  const partCities = CITIES[form.partState] ?? [];
  const svcCities = CITIES[form.svcState] ?? [];
  const models = MODELS_BY_MAKE[form.make] ?? [];
  const partModels = MODELS_BY_MAKE[form.partMake] ?? [];

  function update(patch: Partial<ListForm>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
    setStatus("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form || !user || checking) return;
    void submitAd();
  }

  async function submitAd() {
    if (!form || !user) return;
    const missing =
      form.type === "ev"
        ? [
            ["ev-state", form.state, "State is required."],
            ["ev-make", form.make, "Make is required."],
            ["ev-model", form.model, "Model is required."],
            ["ev-year", form.year, "Year is required."],
            ["ev-city", form.city, "City is required."],
          ]
        : form.type === "ebike"
          ? [
              ["ebike-make", form.make, "Make is required."],
              ["ebike-desc", form.description.trim(), "Describe your bike."],
              ["ev-year", form.year, "Year is required."],
              ["ev-state", form.state, "State is required."],
              ["ev-city", form.city, "City is required."],
            ]
        : form.type === "parts"
          ? [
              ["part-make", form.partMake, "Make is required."],
              ["part-model", form.partModel, "Model is required."],
              ["part-year", form.partYear, "Year is required."],
              ["part-state", form.partState, "State is required."],
              ["part-city", form.partCity, "City is required."],
            ]
          : [
              ["svc-name", form.svcName.trim(), "Business name is required."],
              ["svc-type", form.svcType, "Service type is required."],
              ["svc-state", form.svcState, "State is required."],
              ["svc-city", form.svcCity, "City is required."],
              ["svc-phone", form.contactPhone.trim(), "Phone is required."],
            ];
    const missedIds = missing.filter((item) => !item[1]).map((item) => item[0]);
    const nextErrors = missing.filter((item) => !item[1]).map((item) => item[2]);
    setErrors(nextErrors);
    setMissed(missedIds);
    const first = missedIds[0];
    if (first) {
      const field = document.getElementById(first);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field instanceof HTMLSelectElement || field instanceof HTMLInputElement) field.focus();
      return;
    }
    setMissed([]);
    setHeld(false);
    setChecking(true);
    setStatus("Checking the ad…");

    const words = [
      form.description,
      form.extra,
      form.make,
      form.model,
      form.partDesc,
      form.svcName,
      form.svcNote,
      form.contactName,
    ].join(" ");
    if (offensiveLanguage(words)) {
      setChecking(false);
      setStatus("");
      setErrors(["Please remove the offensive language before this ad can be published."]);
      return;
    }

    let review: "pending" | undefined;
    const reasons: string[] = [];
    const email = user.email.toLowerCase();
    const same = (owner?: string, contact?: string) => owner?.toLowerCase() === email || contact?.toLowerCase() === email;
    const carId = form.type === "ebike" && !editingId ? "" : editingId;
    const ownedCars = cars.filter((car) => same(car.ownerEmail, car.contactEmail));
    const ownedParts = parts.filter((part) => same(part.ownerEmail, part.contactEmail));
    const ownedServices = services.filter((service) => same(service.ownerEmail, service.email));
    const existing =
      form.type === "parts"
        ? ownedParts.find((part) => part.id === editingId)
        : form.type === "service"
          ? ownedServices.find((service) => service.id === editingId)
          : ownedCars.find((car) => car.id === (editingId || carId));
    const alreadyLive = existing?.review !== "pending" && Boolean(existing);
    const otherLive =
      ownedCars.some((car) => car.id !== existing?.id && car.review !== "pending") ||
      ownedParts.some((part) => part.id !== existing?.id && part.review !== "pending") ||
      ownedServices.some((service) => service.id !== existing?.id && service.review !== "pending");
    if (!alreadyLive && !otherLive) {
      review = "pending";
      reasons.push("First ad from this account.");
    }
    const used = new Set(
      [...cars, ...parts, ...services]
        .filter((item) => item.id !== existing?.id)
        .flatMap((item) => item.photos)
        .filter((photo) => photo.length > 20),
    );
    if (form.photos.some((photo) => used.has(photo))) {
      review = "pending";
      reasons.push("A photo matches another ad.");
    }
    if ((form.type === "ev" || form.type === "ebike") && review !== "pending") {
      const photo = await checkVehiclePhoto(form.photos, form.type === "ebike" ? "bike" : "car");
      if (photo === "unsure") {
        review = "pending";
        reasons.push("The photo check was not sure this is the right vehicle or bike.");
      }
    }
    setChecking(false);
    setStatus("");

    saveGen.current += 1;

    const seller = user.role === "dealer" ? "Dealer" : "Private";
    const id = editingId || `${form.type}-${Date.now()}`;
    const featured = FEATURED_OFFERS ? (wasFeatured ? form.feature : false) : false;
    const payForFeature = FEATURED_OFFERS && form.feature && !wasFeatured;
    if (form.type === "ev" || form.type === "ebike") {
      const extra = form.extra.trim();
      const specs = extra
        ? {
            make: form.make,
            model: form.model,
            year: form.year,
            motor: "",
            battery: "",
            range: "",
            vin: form.type === "ev" ? form.vin || undefined : undefined,
            extra,
          }
        : undefined;
      addCar({
        id,
        make: form.type === "ebike" ? form.make.trim() || "eBike" : form.make,
        model: form.model.trim() || (form.type === "ebike" ? "eBike" : form.model),
        year: Number(form.year),
        km: Number(form.km) || 0,
        price: Number(form.price) || 0,
        state: form.state,
        city: form.city,
        registration: form.type === "ev" ? form.registration.trim().toUpperCase() || undefined : undefined,
        writeoff: form.type === "ev" ? form.writeoff : false,
        seller,
        note: form.description.trim() || (form.type === "ebike" ? "Newly listed eBike." : "Newly listed vehicle."),
        featured,
        vin: form.type === "ev" ? form.vin || undefined : undefined,
        photos: form.photos,
        specs,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        ownerEmail: user.email,
        ebike: form.type === "ebike",
        review,
      });
    } else if (form.type === "parts") {
      const title = form.partDesc.trim() || `${form.partYear} ${form.partMake} ${form.partModel}`.trim();
      addPart({
        id,
        title,
        make: form.partMake,
        model: form.partModel,
        year: form.partYear,
        state: form.partState,
        city: form.partCity,
        price: Number(form.partPrice) || 0,
        description: [form.partDesc.trim(), form.batteryNote].filter(Boolean).join("\n\n"),
        photos: form.photos,
        featured,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        ownerEmail: user.email,
        review,
      });
    } else {
      addService({
        id,
        name: form.svcName.trim(),
        serviceType: form.svcType || "Mechanical",
        state: form.svcState,
        city: form.svcCity,
        note: form.svcNote.trim() || "Newly listed workshop.",
        photos: form.photos,
        featured,
        phone: form.contactPhone.trim(),
        email: form.contactEmail.trim() || user.email,
        ownerEmail: user.email,
        review,
      });
    }

    clearDraft();
    hydrated.current = true;
    if (review === "pending") {
      const title =
        form.type === "parts"
          ? form.partDesc.trim() || `${form.partYear} ${form.partMake} ${form.partModel}`.trim()
          : form.type === "service"
            ? form.svcName.trim()
            : `${form.year} ${form.make} ${form.model}`.trim();
      const place =
        form.type === "parts" ? `${form.partCity}, ${form.partState}` : form.type === "service" ? `${form.svcCity}, ${form.svcState}` : `${form.city}, ${form.state}`;
      const kind = form.type === "parts" ? "part" : form.type === "service" ? "service" : "car";
      const root = window.location.pathname.replace(/\/list\/?$/, "");
      const link = `${window.location.origin}${root}/admin?open=${encodeURIComponent(`${kind}:${id}`)}`;
      notifyAdmin({
        subject: "EV Rescue: held ad to check",
        email: user.email,
        message: [
          "A held ad is waiting on Check ads.",
          "",
          "Open the ad and sign in as admin@ev-rescue-au.com.au:",
          link,
          "",
          `Type: ${form.type}`,
          `Title: ${title}`,
          `Place: ${place}`,
          `Seller: ${form.contactName || user.name}`,
          `Seller email: ${user.email}`,
          `Ad id: ${id}`,
          `Photos: ${form.photos.length}`,
          `Why it was held: ${reasons.join(" ") || "Needs a check."}`,
        ].join("\n"),
      });
      setHeld(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (payForFeature) {
      const kind = form.type === "parts" ? "part" : form.type === "service" ? "service" : "car";
      setPendingPay({ kind, id });
      void navigate({ to: "/pay" });
      return;
    }
    if (editingId) {
      void navigate({ to: "/my-ads" });
      return;
    }
    if (form.type === "ebike") {
      void navigate({ to: "/ebikes", search: { notice: "listed" } });
      return;
    }
    if (form.type === "ev") {
      void navigate({ to: "/cars", search: { state: form.state, notice: "listed" } });
      return;
    }
    if (form.type === "parts") {
      void navigate({ to: "/parts", search: { state: form.partState, make: form.partMake, model: form.partModel, notice: "listed" } });
      return;
    }
    void navigate({
      to: "/workshops",
      search: { state: form.svcState, notice: "listed" },
    });
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold">{editingId ? "Edit your ad" : "Place a free ad"}</h1>
        {held ? (
          <div className="mt-4 rounded-md border border-accent bg-bg p-4 text-sm" role="status">
            <p>Your ad is pending review. Would you like to post another ad?</p>
            <button
              type="button"
              className="glow-hover mt-3 min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink"
              onClick={() => {
                if (!user) return;
                saveGen.current += 1;
                clearDraft();
                setHeld(false);
                setEditingId("");
                setWasFeatured(false);
                setErrors([]);
                setMissed([]);
                setStatus("");
                setForm(blankForm(user));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Post another ad
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {editingId
              ? "Change the details or photos, then save. The same ad is updated."
              : "A basic ad is free. Drafts save on this device for 7 days."}
          </p>
        )}
        <p className="mt-2 min-h-5 text-sm text-accent" role="status">
          {status}
        </p>
        {errors.length ? (
          <ul className="mt-3 list-disc space-y-1 rounded-md border border-danger bg-bg p-3 pl-8 text-sm text-danger" role="alert">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">What are you listing?</span>
            <select className={fieldClass} value={form.type} disabled={Boolean(editingId)} onChange={(event) => update({ type: event.target.value as ListForm["type"] })}>
              <option value="ev">EV</option>
              <option value="ebike">eBike</option>
              <option value="parts">Parts</option>
              <option value="service">Service</option>
            </select>
          </label>

          {form.type === "ev" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Select id="ev-state" invalid={missed.includes("ev-state") && !form.state} label="State" value={form.state} options={[...STATES]} onChange={(state) => update({ state, city: "" })} />
              <Select id="ev-make" invalid={missed.includes("ev-make") && !form.make} label="Make" value={form.make} options={MAKES} onChange={(make) => update({ make, model: "" })} />
              <Select id="ev-model" invalid={missed.includes("ev-model") && !form.model} label="Model" value={form.model} options={models} placeholder="Select model" onChange={(model) => update({ model })} />
              <Select id="ev-year" invalid={missed.includes("ev-year") && !form.year} label="Year" value={form.year} options={YEARS} onChange={(year) => update({ year })} />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Registration (optional)</span>
                <span className={`rego-plate mt-1 ${plateClass(form.state)}`}>
                  <input
                    aria-label="Registration"
                    value={form.registration}
                    maxLength={10}
                    autoComplete="off"
                    placeholder="ABC123"
                    style={{ fontSize: plateFont(form.registration || "ABC123") }}
                    onChange={(event) => update({ registration: event.target.value.toUpperCase() })}
                  />
                  {plateName(form.state) ? <span className="rego-legend">{plateName(form.state)}</span> : null}
                </span>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 flex flex-wrap items-center gap-2 font-medium">
                  VIN (optional)
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-accent"
                    onClick={() => setVinWhy((open) => !open)}
                  >
                    Why use VIN?
                  </button>
                </span>
                {vinWhy ? (
                  <p className="mb-2 text-sm text-muted">
                    A VIN lets a buyer check this exact car, including money owing and the accident report. You can leave it blank.
                  </p>
                ) : null}
                <input className={fieldClass} value={form.vin} maxLength={17} onChange={(event) => update({ vin: event.target.value.toUpperCase() })} />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Add more information (optional)</span>
                <textarea
                  className="min-h-20 w-full rounded-md border border-border bg-bg px-3 py-2"
                  value={form.extra}
                  onChange={(event) => update({ extra: event.target.value })}
                />
              </label>
              <Select id="ev-city" invalid={missed.includes("ev-city") && !form.city} label="City" value={form.city} options={cities} placeholder="Select city" onChange={(city) => update({ city })} />
              <Field label="Kilometres (optional)" value={form.km} onChange={(km) => update({ km })} inputMode="numeric" />
              <Field label="Price AUD (optional)" value={form.price} onChange={(price) => update({ price })} inputMode="numeric" />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Description (optional)</span>
                <textarea className="min-h-24 w-full rounded-md border border-border bg-bg px-3 py-2" value={form.description} onChange={(event) => update({ description: event.target.value })} />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={form.writeoff} onChange={(event) => update({ writeoff: event.target.checked })} />
                Tag this ad as a repaired write-off
              </label>
            </div>
          ) : null}

          {form.type === "ebike" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Select id="ebike-make" invalid={missed.includes("ebike-make") && !form.make} label="Make" value={form.make} options={[...E_MOTO_MAKES]} placeholder="Select make" onChange={(make) => update({ make })} />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Describe your bike</span>
                <textarea
                  id="ebike-desc"
                  className={`min-h-24 w-full rounded-md border bg-bg px-3 py-2 ${missed.includes("ebike-desc") && !form.description.trim() ? "border-danger" : "border-border"}`}
                  value={form.description}
                  onChange={(event) => update({ description: event.target.value })}
                />
              </label>
              <Select id="ev-year" invalid={missed.includes("ev-year") && !form.year} label="Year" value={form.year} options={YEARS} onChange={(year) => update({ year })} />
              <Field label="Hours (optional)" value={form.km} onChange={(km) => update({ km })} inputMode="numeric" />
              <Select id="ev-city" invalid={missed.includes("ev-city") && !form.city} label="City" value={form.city} options={cities} placeholder="Select city" onChange={(city) => update({ city })} />
              <Select id="ev-state" invalid={missed.includes("ev-state") && !form.state} label="State" value={form.state} options={[...STATES]} onChange={(state) => update({ state, city: "" })} />
              <Field label="Price AUD (optional)" value={form.price} onChange={(price) => update({ price })} inputMode="numeric" />
            </div>
          ) : null}

          {form.type === "parts" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Select id="part-make" invalid={missed.includes("part-make") && !form.partMake} label="Make" value={form.partMake} options={MAKES} onChange={(partMake) => update({ partMake, partModel: "" })} />
              <Select id="part-model" invalid={missed.includes("part-model") && !form.partModel} label="Model" value={form.partModel} options={partModels} placeholder="Select model" onChange={(partModel) => update({ partModel })} />
              <Select id="part-year" invalid={missed.includes("part-year") && !form.partYear} label="Year" value={form.partYear} options={YEARS} onChange={(partYear) => update({ partYear })} />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 flex flex-wrap items-center gap-2 font-medium">
                  VIN (optional)
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-accent"
                    onClick={() => setVinWhy((open) => !open)}
                  >
                    Why use VIN?
                  </button>
                </span>
                {vinWhy ? (
                  <p className="mb-2 text-sm text-muted">
                    A VIN helps a buyer match the part to the exact car. You can leave it blank.
                  </p>
                ) : null}
                <input className={fieldClass} value={form.vin} maxLength={17} onChange={(event) => update({ vin: event.target.value.toUpperCase() })} />
              </label>
              <Select id="part-state" invalid={missed.includes("part-state") && !form.partState} label="State" value={form.partState} options={[...STATES]} onChange={(partState) => update({ partState, partCity: "" })} />
              <Select id="part-city" invalid={missed.includes("part-city") && !form.partCity} label="City" value={form.partCity} options={partCities} placeholder="Select city" onChange={(partCity) => update({ partCity })} />
              <Field label="Price AUD (optional)" value={form.partPrice} onChange={(partPrice) => update({ partPrice })} inputMode="numeric" />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Description (optional)</span>
                <textarea className="min-h-24 w-full rounded-md border border-border bg-bg px-3 py-2" value={form.partDesc} onChange={(event) => update({ partDesc: event.target.value })} />
              </label>
            </div>
          ) : null}

          {form.type === "service" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Business name</span>
                <input id="svc-name" className={`${fieldClass} ${missed.includes("svc-name") && !form.svcName.trim() ? "border-danger ring-2 ring-danger" : ""}`} value={form.svcName} onChange={(event) => update({ svcName: event.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Service type</span>
                <select id="svc-type" className={`${fieldClass} ${missed.includes("svc-type") && !form.svcType ? "border-danger ring-2 ring-danger" : ""}`} value={form.svcType} aria-invalid={missed.includes("svc-type") && !form.svcType} onChange={(event) => update({ svcType: event.target.value as ListForm["svcType"] })}>
                  <option value="">Select…</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Panel">Panel</option>
                  <option value="Both">Both</option>
                </select>
              </label>
              <Select id="svc-state" invalid={missed.includes("svc-state") && !form.svcState} label="State" value={form.svcState} options={[...STATES]} onChange={(svcState) => update({ svcState, svcCity: "" })} />
              <Select id="svc-city" invalid={missed.includes("svc-city") && !form.svcCity} label="City" value={form.svcCity} options={svcCities} placeholder="Select city" onChange={(svcCity) => update({ svcCity })} />
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium">Notes (optional)</span>
                <textarea className="min-h-24 w-full rounded-md border border-border bg-bg px-3 py-2" value={form.svcNote} onChange={(event) => update({ svcNote: event.target.value })} />
              </label>
            </div>
          ) : null}

          <PhotoPicker photos={form.photos} onChange={(photos) => update({ photos })} />
          {form.type === "ev" || form.type === "ebike" ? (
            <p className="text-sm text-muted">A clear photo of the whole vehicle is approved straight away. A blurry, tiny or unrelated picture is sent to be checked.</p>
          ) : null}

          <fieldset className="rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Contact details from your account</legend>
            <p className="mb-3 text-xs text-muted">Filled in for you. You do not need to retype them.</p>
            <div className={`grid gap-3 ${form.type === "service" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              <Field label="Name" value={form.contactName} onChange={(contactName) => update({ contactName })} />
              <Field label="Email" value={form.contactEmail} onChange={(contactEmail) => update({ contactEmail })} />
              {form.type === "service" ? (
                <Field id="svc-phone" invalid={missed.includes("svc-phone") && !form.contactPhone.trim()} label="Phone" value={form.contactPhone} onChange={(contactPhone) => update({ contactPhone })} />
              ) : null}
            </div>
          </fieldset>

          {FEATURED_OFFERS ? (
          <button
            type="button"
            className={form.feature ? "feature-btn is-on glow-hover min-h-11 px-4 text-sm" : "feature-btn glow-hover min-h-11 px-4 text-sm"}
            aria-pressed={form.feature}
            onClick={() => update({ feature: !form.feature })}
          >
            Feature this ad
          </button>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {held ? null : (
              <button type="submit" className="glow-hover min-h-11 rounded-md bg-accent px-4 text-sm font-semibold text-accent-ink">
                {editingId ? (form.feature && !wasFeatured ? "Continue to payment" : "Save changes") : form.feature ? "Continue to payment" : "Publish free ad"}
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-md border border-border px-4 text-sm"
              onClick={() => {
                saveGen.current += 1;
                clearDraft();
                setForm(blankForm(user));
                setErrors([]);
                setStatus("Draft cleared");
              }}
            >
              Clear draft
            </button>
          </div>
        </form>
      </main>
    </Shell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  inputMode,
  invalid = false,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "text";
  invalid?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input id={id} className={`${fieldClass} ${invalid ? "border-danger ring-2 ring-danger" : ""}`} value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label className="block text-sm" htmlFor={id}>
      <span className="mb-1 block font-medium">{label}</span>
      <select
        id={id}
        className={`${fieldClass} ${invalid ? "border-danger ring-2 ring-danger" : ""}`}
        value={value}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
