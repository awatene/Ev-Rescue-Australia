import { createServerFn } from "@tanstack/react-start";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { getSql } from "@/lib/db";
import { sendMail } from "./send-mail.server";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function temporaryPassword() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export const sendTemporaryPassword = createServerFn({ method: "POST" })
  .validator((email: string) => email.trim().toLowerCase())
  .handler(async ({ data: email }): Promise<{ ok: true } | { error: string }> => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
    const sql = await getSql();
    const users = await sql<{ id: string }>`select id from "user" where lower(email) = ${email} limit 1`;
    const user = users[0];
    if (!user) return { error: "No account uses that email. Create one first." };
    const password = temporaryPassword();
    const hashed = await hashPassword(password);
    const accounts = await sql<{ id: string; password: string | null }>`
      select id, password from "account" where "userId" = ${user.id} and "providerId" = 'credential' limit 1
    `;
    const account = accounts[0];
    const previous = account?.password ?? null;
    if (account) {
      await sql`update "account" set password = ${hashed}, "updatedAt" = now() where id = ${account.id}`;
    } else {
      const id = crypto.randomUUID();
      await sql`
        insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        values (${id}, ${user.id}, 'credential', ${user.id}, ${hashed}, now(), now())
      `;
    }
    try {
      await sendMail({
        to: email,
        subject: "Your EV Rescue temporary password",
        text: [
          "A temporary password was requested for your EV Rescue Australia account.",
          "",
          `Temporary password: ${password}`,
          "",
          "Sign in at https://www.ev-rescue-au.com.au/login",
          "Then open your profile and choose a new password.",
          "",
          "If you did not ask for this, email admin@ev-rescue-au.com.au.",
        ].join("\n"),
      });
    } catch {
      if (account && previous) {
        await sql`update "account" set password = ${previous}, "updatedAt" = now() where id = ${account.id}`;
      } else if (!account) {
        await sql`delete from "account" where "userId" = ${user.id} and "providerId" = 'credential'`;
      }
      return { error: "The reset email could not be sent. Try again in a few minutes." };
    }
    await sql`delete from "session" where "userId" = ${user.id}`;
    await sql`
      insert into temp_passwords (email) values (${email})
      on conflict (email) do update set created_at = now()
    `;
    return { ok: true };
  });

export const needsTemporaryPassword = createServerFn({ method: "POST" })
  .validator((email: string) => email.trim().toLowerCase())
  .handler(async ({ data: email }): Promise<boolean> => {
    if (!email) return false;
    const sql = await getSql();
    const rows = await sql<{ email: string }>`select email from temp_passwords where email = ${email} limit 1`;
    return Boolean(rows[0]);
  });

export const checkTemporaryPassword = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => ({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  }))
  .handler(async ({ data }): Promise<{ ok: true } | { error: string }> => {
    const match = await passwordMatches(data.email, data.password);
    if (!match) return { error: "That temporary password is not right." };
    return { ok: true };
  });

export const replaceTemporaryPassword = createServerFn({ method: "POST" })
  .validator((input: { email: string; current: string; next: string }) => ({
    email: input.email.trim().toLowerCase(),
    current: input.current,
    next: input.next,
  }))
  .handler(async ({ data }): Promise<{ ok: true } | { error: string }> => {
    if (!passwordStrong(data.next)) return { error: "The new password does not meet the strength rules." };
    const sql = await getSql();
    const users = await sql<{ id: string }>`select id from "user" where lower(email) = ${data.email} limit 1`;
    const user = users[0];
    if (!user) return { error: "That account could not be found." };
    const accounts = await sql<{ id: string; password: string | null }>`
      select id, password from "account" where "userId" = ${user.id} and "providerId" = 'credential' limit 1
    `;
    const account = accounts[0];
    if (!account?.password || !(await verifyPassword({ hash: account.password, password: data.current }))) {
      return { error: "That temporary password is not right." };
    }
    const hashed = await hashPassword(data.next);
    await sql`update "account" set password = ${hashed}, "updatedAt" = now() where id = ${account.id}`;
    await sql`delete from temp_passwords where email = ${data.email}`;
    return { ok: true };
  });

async function passwordMatches(email: string, password: string) {
  const sql = await getSql();
  const rows = await sql<{ password: string | null }>`
    select a.password from "account" a
    join "user" u on u.id = a."userId"
    where lower(u.email) = ${email} and a."providerId" = 'credential'
    limit 1
  `;
  const hash = rows[0]?.password;
  if (!hash) return false;
  return verifyPassword({ hash, password });
}

function passwordStrong(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}
