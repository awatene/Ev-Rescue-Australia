type Mail = {
  to: string;
  subject: string;
  text: string;
};

/** Send one plain-text email through Resend. Requires RESEND_API_KEY on the server. */
export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const from = process.env.RESEND_FROM?.trim() || "EV Rescue <admin@ev-rescue-au.com.au>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(detail || "Resend rejected the email");
  }
}
