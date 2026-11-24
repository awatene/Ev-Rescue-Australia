import { createServerFn } from "@tanstack/react-start";
import type { User } from "@/lib/market/types";

function text(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function fromRow(row: Record<string, unknown>): User {
  const role = text(row.role) === "dealer" ? "dealer" : "private";
  const photo = text(row.photo, 600000);
  return {
    email: text(row.email),
    name: text(row.name) || "Member",
    phone: text(row.phone),
    role,
    businessName: role === "dealer" ? text(row.business_name) || undefined : undefined,
    abn: role === "dealer" ? text(row.abn).replace(/\D/g, "") || undefined : undefined,
    provider: text(row.provider) || undefined,
    photo: photo.startsWith("data:image") || photo.startsWith("https://") || photo.startsWith("/") ? photo : undefined,
  };
}

export const loadProfile = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }): Promise<User | null> => {
    const email = text(data.email).toLowerCase();
    if (!email) return null;
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`select * from profiles where email = ${email} limit 1`;
    return rows[0] ? fromRow(rows[0]) : null;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .validator((user: User) => user)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = text(data.email).toLowerCase();
    if (!email) return { ok: true };
    const role = data.role === "dealer" ? "dealer" : "private";
    const photo = text(data.photo, 600000);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into profiles (email, name, phone, role, business_name, abn, provider, photo, updated_at)
      values (
        ${email},
        ${text(data.name) || email.split("@")[0] || "Member"},
        ${text(data.phone)},
        ${role},
        ${role === "dealer" ? text(data.businessName) || null : null},
        ${role === "dealer" ? text(data.abn).replace(/\D/g, "") || null : null},
        ${text(data.provider) || null},
        ${photo.startsWith("data:image") || photo.startsWith("https://") || photo.startsWith("/") ? photo : null},
        ${Date.now()}
      )
      on conflict (email) do update set
        name = excluded.name,
        phone = excluded.phone,
        role = excluded.role,
        business_name = excluded.business_name,
        abn = excluded.abn,
        provider = excluded.provider,
        photo = excluded.photo,
        updated_at = excluded.updated_at
    `;
    return { ok: true };
  });
