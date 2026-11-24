const KEY = "evrescue.ads-checked";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function adsCheckedToday() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) === today();
}

export function markAdsChecked() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, today());
}
