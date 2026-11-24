const FORM = "https://formspree.io/f/xjywpglw";

/** Email the EV Rescue admin. The Formspree address is public by design. */
export function notifyAdmin(fields: { subject: string; email?: string; message: string }) {
  void fetch(FORM, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      _subject: fields.subject,
      _replyto: fields.email || "admin@ev-rescue-au.com.au",
      email: fields.email || "admin@ev-rescue-au.com.au",
      message: fields.message,
    }),
  }).catch(() => undefined);
}
