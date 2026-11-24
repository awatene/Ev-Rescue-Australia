import { createServerFn } from "@tanstack/react-start";
import type { AdMessage } from "@/lib/market/types";

function text(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function emailOf(value: unknown) {
  return text(value, 200).toLowerCase();
}

function fromRow(row: Record<string, unknown>): AdMessage {
  const kind = text(row.kind) === "part" ? "part" : "car";
  return {
    id: text(row.id, 80),
    kind,
    adId: text(row.ad_id, 80),
    adTitle: text(row.ad_title),
    sellerEmail: text(row.seller_email),
    buyerEmail: text(row.buyer_email),
    buyerName: text(row.buyer_name),
    text: text(row.body, 2000),
    createdAt: Number(row.created_at) || 0,
    read: Boolean(row.read),
    reply: text(row.reply, 2000) || undefined,
    replyAt: row.reply_at == null ? undefined : Number(row.reply_at) || undefined,
  };
}

export const listMessages = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }): Promise<AdMessage[]> => {
    const email = emailOf(data.email);
    if (!email) return [];
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<Record<string, unknown>>`
      select * from messages
      where lower(seller_email) = ${email} or lower(buyer_email) = ${email}
      order by created_at desc
    `;
    return rows.map(fromRow);
  });

export const saveMessage = createServerFn({ method: "POST" })
  .validator((message: AdMessage) => message)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    if (!text(data.id, 80) || !emailOf(data.sellerEmail) || !emailOf(data.buyerEmail) || !text(data.text, 2000)) {
      throw new Error("Message is incomplete.");
    }
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const kind = data.kind === "part" ? "part" : "car";
    await sql`
      insert into messages (
        id, kind, ad_id, ad_title, seller_email, buyer_email, buyer_name, body, created_at, read
      ) values (
        ${text(data.id, 80)}, ${kind}, ${text(data.adId, 80)}, ${text(data.adTitle)},
        ${text(data.sellerEmail)}, ${text(data.buyerEmail)}, ${text(data.buyerName) || "Buyer"},
        ${text(data.text, 2000)}, ${Number(data.createdAt) || Date.now()}, false
      )
      on conflict (id) do nothing
    `;
    return { ok: true };
  });

export const saveReply = createServerFn({ method: "POST" })
  .validator((input: { id: string; email: string; reply: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const reply = text(data.reply, 2000);
    const email = emailOf(data.email);
    if (!text(data.id, 80) || !email || !reply) return { ok: true };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update messages
      set reply = ${reply}, reply_at = ${Date.now()}
      where id = ${text(data.id, 80)} and lower(seller_email) = ${email}
    `;
    return { ok: true };
  });

export const saveMessageRead = createServerFn({ method: "POST" })
  .validator((input: { id: string; email: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const email = emailOf(data.email);
    if (!text(data.id, 80) || !email) return { ok: true };
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      update messages
      set read = true
      where id = ${text(data.id, 80)}
        and (lower(seller_email) = ${email} or lower(buyer_email) = ${email})
    `;
    return { ok: true };
  });
