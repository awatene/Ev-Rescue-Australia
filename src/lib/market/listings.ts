import { createServerFn } from "@tanstack/react-start";
import type { Car, Part, Service, ServiceType, Specs } from "@/lib/market/types";

type ListingRows = { cars: Car[]; parts: Part[]; services: Service[] };

function text(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function photosOf(value: unknown) {
  const list = Array.isArray(value) ? value : [];
  return list.map((item) => String(item)).filter((item) => item.startsWith("data:image") || item.startsWith("https://") || item.startsWith("/")).slice(0, 10);
}

function stillFeatured(row: Record<string, unknown>) {
  if (!row.featured) return false;
  if (row.featured_until == null) return true;
  const until = new Date(String(row.featured_until)).getTime();
  return Number.isFinite(until) && until > Date.now();
}
function jsonValue(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

function carFrom(row: Record<string, unknown>): Car {
  const specs = jsonValue(row.specs);
  return {
    id: text(row.id, 80),
    make: text(row.make),
    model: text(row.model),
    year: Number(row.year) || 0,
    km: Number(row.km) || 0,
    price: Number(row.price) || 0,
    state: text(row.state, 10),
    city: text(row.city),
    registration: text(row.registration, 10).toUpperCase() || undefined,
    writeoff: Boolean(row.writeoff),
    seller: text(row.seller),
    note: text(row.note, 2000),
    featured: stillFeatured(row),
    vin: text(row.vin, 32) || undefined,
    photos: photosOf(jsonValue(row.photos)),
    specs: specs && typeof specs === "object" && !Array.isArray(specs) ? (specs as Specs) : undefined,
    contactName: text(row.contact_name) || undefined,
    contactEmail: text(row.contact_email) || undefined,
    contactPhone: text(row.contact_phone, 40) || undefined,
    ownerEmail: text(row.owner_email) || undefined,
    ebike: text(row.id, 80).startsWith("ebike-"),
    review: row.review === "pending" ? "pending" : undefined,
  };
}

function partFrom(row: Record<string, unknown>): Part {
  return {
    id: text(row.id, 80),
    title: text(row.title),
    make: text(row.make),
    model: text(row.model),
    year: text(row.year, 10),
    state: text(row.state, 10),
    city: text(row.city),
    price: Number(row.price) || 0,
    description: text(row.description, 2000),
    photos: photosOf(jsonValue(row.photos)),
    featured: stillFeatured(row),
    contactName: text(row.contact_name) || undefined,
    contactEmail: text(row.contact_email) || undefined,
    contactPhone: text(row.contact_phone, 40) || undefined,
    ownerEmail: text(row.owner_email) || undefined,
    review: row.review === "pending" ? "pending" : undefined,
  };
}

function serviceFrom(row: Record<string, unknown>): Service {
  const kind = text(row.service_type);
  const serviceType: ServiceType = kind === "Panel" || kind === "Both" ? kind : "Mechanical";
  return {
    id: text(row.id, 80),
    name: text(row.name),
    serviceType,
    state: text(row.state, 10),
    city: text(row.city),
    note: text(row.note, 2000),
    photos: photosOf(jsonValue(row.photos)),
    featured: stillFeatured(row),
    phone: text(row.phone, 40),
    email: text(row.email),
    ownerEmail: text(row.owner_email) || undefined,
    review: row.review === "pending" ? "pending" : undefined,
  };
}

export const listListings = createServerFn({ method: "GET" }).handler(async (): Promise<ListingRows> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const cars = await sql<Record<string, unknown>>`select * from cars order by created_at desc`;
  const parts = await sql<Record<string, unknown>>`select * from parts order by created_at desc`;
  const services = await sql<Record<string, unknown>>`select * from services order by created_at desc`;
  return { cars: cars.map(carFrom), parts: parts.map(partFrom), services: services.map(serviceFrom) };
});

export const saveCar = createServerFn({ method: "POST" })
  .validator((car: Car) => car)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!text(data.id, 80) || !text(data.make) || !text(data.model) || !text(data.state, 10) || !text(data.city)) {
      throw new Error("Car listing is incomplete.");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const photos = JSON.stringify(photosOf(data.photos));
    const specs = data.specs ? JSON.stringify(data.specs) : null;
    await sql`
      insert into cars (
        id, make, model, year, km, price, state, city, registration, writeoff, seller, note, featured, vin, photos, specs,
        contact_name, contact_email, contact_phone, owner_email, review
      ) values (
        ${text(data.id, 80)}, ${text(data.make)}, ${text(data.model)}, ${Number(data.year) || 0}, ${Number(data.km) || 0},
        ${Number(data.price) || 0}, ${text(data.state, 10)}, ${text(data.city)}, ${text(data.registration, 10).toUpperCase() || null}, ${Boolean(data.writeoff)}, ${text(data.seller)},
        ${text(data.note, 2000)}, ${Boolean(data.featured)}, ${text(data.vin, 32) || null}, ${photos}::jsonb, ${specs}::jsonb,
        ${text(data.contactName) || null}, ${text(data.contactEmail) || null}, ${text(data.contactPhone, 40) || null}, ${text(data.ownerEmail) || null},
        ${data.review === "pending" ? "pending" : "live"}
      )
      on conflict (id) do update set
        make = excluded.make,
        model = excluded.model,
        year = excluded.year,
        km = excluded.km,
        price = excluded.price,
        state = excluded.state,
        city = excluded.city,
        registration = excluded.registration,
        writeoff = excluded.writeoff,
        seller = excluded.seller,
        note = excluded.note,
        featured = excluded.featured,
        vin = excluded.vin,
        photos = excluded.photos,
        specs = excluded.specs,
        contact_name = excluded.contact_name,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        owner_email = excluded.owner_email,
        review = excluded.review
    `;
    return { ok: true };
  });

export const savePart = createServerFn({ method: "POST" })
  .validator((part: Part) => part)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!text(data.id, 80) || !text(data.title) || !text(data.make) || !text(data.state, 10) || !text(data.city)) {
      throw new Error("Parts listing is incomplete.");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into parts (
        id, title, make, model, year, state, city, price, description, photos, featured,
        contact_name, contact_email, contact_phone, owner_email, review
      ) values (
        ${text(data.id, 80)}, ${text(data.title)}, ${text(data.make)}, ${text(data.model)}, ${text(data.year, 10)},
        ${text(data.state, 10)}, ${text(data.city)}, ${Number(data.price) || 0}, ${text(data.description, 2000)},
        ${JSON.stringify(photosOf(data.photos))}::jsonb, ${Boolean(data.featured)},
        ${text(data.contactName) || null}, ${text(data.contactEmail) || null}, ${text(data.contactPhone, 40) || null}, ${text(data.ownerEmail) || null},
        ${data.review === "pending" ? "pending" : "live"}
      )
      on conflict (id) do update set
        title = excluded.title,
        make = excluded.make,
        model = excluded.model,
        year = excluded.year,
        state = excluded.state,
        city = excluded.city,
        price = excluded.price,
        description = excluded.description,
        photos = excluded.photos,
        featured = excluded.featured,
        contact_name = excluded.contact_name,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        owner_email = excluded.owner_email,
        review = excluded.review
    `;
    return { ok: true };
  });

export const saveService = createServerFn({ method: "POST" })
  .validator((service: Service) => service)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!text(data.id, 80) || !text(data.name) || !text(data.state, 10) || !text(data.city)) {
      throw new Error("Workshop listing is incomplete.");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const serviceType: ServiceType = data.serviceType === "Panel" || data.serviceType === "Both" ? data.serviceType : "Mechanical";
    await sql`
      insert into services (
        id, name, service_type, state, city, note, photos, featured, phone, email, owner_email, review
      ) values (
        ${text(data.id, 80)}, ${text(data.name)}, ${serviceType}, ${text(data.state, 10)}, ${text(data.city)},
        ${text(data.note, 2000)}, ${JSON.stringify(photosOf(data.photos))}::jsonb, ${Boolean(data.featured)},
        ${text(data.phone, 40)}, ${text(data.email)}, ${text(data.ownerEmail) || null},
        ${data.review === "pending" ? "pending" : "live"}
      )
      on conflict (id) do update set
        name = excluded.name,
        service_type = excluded.service_type,
        state = excluded.state,
        city = excluded.city,
        note = excluded.note,
        photos = excluded.photos,
        featured = excluded.featured,
        phone = excluded.phone,
        email = excluded.email,
        owner_email = excluded.owner_email,
        review = excluded.review
    `;
    return { ok: true };
  });

export const featureListing = createServerFn({ method: "POST" })
  .validator((input: { kind: "car" | "part" | "service"; id: string; days?: number; method?: string; plan?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const id = text(data.id, 80);
    if (!id) return { ok: true };
    const days = data.days === 365 || data.days === 90 ? data.days : 30;
    const method = data.method === "paypal" ? "paypal" : "card";
    const plan = text(data.plan, 10) || String(days === 365 ? 99 : days === 90 ? 19 : 11);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (data.kind === "car") await sql`update cars set featured = true, featured_until = now() + (${String(days)} || ' days')::interval where id = ${id}`;
    else if (data.kind === "part") await sql`update parts set featured = true, featured_until = now() + (${String(days)} || ' days')::interval where id = ${id}`;
    else await sql`update services set featured = true, featured_until = now() + (${String(days)} || ' days')::interval where id = ${id}`;
    await sql`
      insert into feature_payments (id, listing_kind, listing_id, plan, method, days)
      values (${`${data.kind}-${id}-${Date.now()}`}, ${data.kind}, ${id}, ${plan}, ${method}, ${days})
    `;
    return { ok: true };
  });

export const deleteCar = createServerFn({ method: "POST" })
  .validator((id: string) => id.trim())
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from cars where id = ${text(data, 80)}`;
    return { ok: true };
  });

export const deletePart = createServerFn({ method: "POST" })
  .validator((id: string) => id.trim())
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from parts where id = ${text(data, 80)}`;
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .validator((id: string) => id.trim())
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from services where id = ${text(data, 80)}`;
    return { ok: true };
  });
