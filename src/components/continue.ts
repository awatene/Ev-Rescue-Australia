import type { Intent } from "@/lib/market/types";

export function continueHref(intent: Intent) {
  if (intent?.kind === "list") return "/list";
  if (intent?.kind === "mine") return "/my-ads";
  if (intent?.kind === "inbox") return "/inbox";
  if (intent?.kind === "profile") return "/profile";
  if (intent?.kind === "admin") return intent.open ? `/admin?open=${encodeURIComponent(intent.open)}` : "/admin";
  if (intent?.kind === "message") return `/?open=${intent.target}:${intent.id}&panel=message`;
  if (intent?.kind === "contact") return `/?open=service:${intent.id}&panel=contact`;
  if (intent?.kind === "battery") return `/?open=${intent.target}:${intent.id}&panel=battery`;
  if (intent?.kind === "report") return `/?open=${intent.target}:${intent.id}&panel=report`;
  if (intent?.kind === "flag") return `/?open=${intent.target}:${intent.id}&panel=flag`;
  return "/";
}
