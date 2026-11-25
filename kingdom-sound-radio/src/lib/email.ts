import "server-only";

type Mail = { to: string; subject: string; text: string };

/**
 * Sends transactional email through Resend when RESEND_API_KEY is set.
 * Without it (development/preview), the message is written to the server log
 * so verification and reset links can still be followed — never in production.
 */
export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[email] not configured — message to ${mail.to} was not sent`);
    } else {
      console.info(`[email:dev] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    }
    return { delivered: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "The Kingdom Sound Radio <no-reply@example.org>",
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) console.error(`[email] provider returned ${res.status}`);
  return { delivered: res.ok };
}
