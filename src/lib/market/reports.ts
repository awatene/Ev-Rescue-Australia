import { createServerFn } from "@tanstack/react-start";
import type { AdFlag } from "@/lib/market/types";

function text(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function fromRow(row: Record<string, unknown>): AdFlag {
  const kind = text(row.kind) === "part" ? "part" : text(row.kind) === "service" ? "service" : "car";
  const status = text(row.status) === "kept" ? "kept" : text(row.status) === "removed" ? "removed" : "open";
  return {
    id: text(row.id, 80),
    kind,
    adId: text(row.ad_id, 80),
    adTitle: text(row.ad_title),
    reporterEmail: text(row.reporter_email),
    reporterName: text(row.reporter_name),
    reason: text(row.reason),
    note: text(row.note, 500),
    createdAt: Number(row.created_at) || 0,
    status,
  };
}

export const listReports = createServerFn({ method: "GET" }).handler(async (): Promise<AdFlag[]> => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`select * from ad_reports order by created_at desc`;
  return rows.map(fromRow);
});

export const saveReport = createServerFn({ method: "POST" })
  .validator((flag: AdFlag) => flag)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into ad_reports (id, kind, ad_id, ad_title, reporter_email, reporter_name, reason, note, status, created_at)
      values (
        ${text(data.id, 80)}, ${data.kind}, ${text(data.adId, 80)}, ${text(data.adTitle)},
        ${text(data.reporterEmail)}, ${text(data.reporterName)}, ${text(data.reason)}, ${text(data.note, 500)},
        ${data.status}, ${Number(data.createdAt) || Date.now()}
      )
      on conflict (id) do update set status = excluded.status, note = excluded.note, reason = excluded.reason
    `;
    return { ok: true };
  });
