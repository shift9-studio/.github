const RESEND_ENDPOINT = "https://api.resend.com/emails";
const CONFIRMATION_TIMEOUT_MS = 5_000;

const SUBJECT = "You're on the Flow State private beta list";
const TEXT = `You're on the Flow State private beta list.

Flow State puts local voice dictation into the Windows app you are already using. Your speech stays on your PC.

We'll email this address when your build is ready.

Questions? Reply to this email or write to shift9dev@gmail.com.

— Shift-9`;
const HTML = `<h1>You're on the Flow State private beta list.</h1>
<p>Flow State puts local voice dictation into the Windows app you are already using. Your speech stays on your PC.</p>
<p>We'll email this address when your build is ready.</p>
<p>Questions? Reply to this email or write to <a href="mailto:shift9dev@gmail.com">shift9dev@gmail.com</a>.</p>
<p>— Shift-9</p>`;

export type ConfirmationOutcome =
  | "sent"
  | "unconfigured"
  | "rejected"
  | "failed";

type ConfirmationOptions = {
  apiKey?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

export async function flowStateConfirmationIdempotencyKey(email: string) {
  const input = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `flow-state-confirmation/${hash}`;
}

export async function sendFlowStateConfirmation(
  email: string,
  options: ConfirmationOptions = {},
): Promise<ConfirmationOutcome> {
  const apiKey = options.apiKey ?? process.env.RESEND_API_KEY;
  if (!apiKey) return "unconfigured";

  const fetcher = options.fetcher ?? fetch;
  const signal = options.signal ?? AbortSignal.timeout(CONFIRMATION_TIMEOUT_MS);
  const recipient = email.trim();
  const idempotencyKey = await flowStateConfirmationIdempotencyKey(recipient);

  try {
    const response = await fetcher(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
        "User-Agent": "shift9.dev/flow-state",
      },
      body: JSON.stringify({
        from: "Flow State <updates@shift9.dev>",
        to: [recipient],
        reply_to: "shift9dev@gmail.com",
        subject: SUBJECT,
        text: TEXT,
        html: HTML,
      }),
      signal,
    });
    return response.ok ? "sent" : "rejected";
  } catch {
    return "failed";
  }
}
