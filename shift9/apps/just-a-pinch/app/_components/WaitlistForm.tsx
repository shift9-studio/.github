"use client";

import { useState } from "react";

/* Launch-waitlist capture form. Posts to /api/waitlist (→ Supabase via
   @shift9/data). Warm, plain-spoken voice — no techy chrome. Every state is
   announced politely for assistive tech; the button stays legible and keeps a
   visible focus ring. No animation, so nothing to gate for reduced motion. */

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "empty" }
  | { kind: "duplicate" }
  | { kind: "error" };

const MESSAGES: Record<Exclude<State["kind"], "idle" | "submitting">, string> = {
  success: "You’re on the list. We’ll email you the moment it lands.",
  duplicate: "You’re already on the list — hang tight, it’s coming soon.",
  empty: "Pop your email in first and we’ll take it from there.",
  error: "Something went sideways on our end. Give it another go in a moment.",
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submitting = state.kind === "submitting";
  const done = state.kind === "success";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setState({ kind: "empty" });
      return;
    }
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (res.ok) {
        setState({ kind: "success" });
        setEmail("");
      } else if (res.status === 409) {
        setState({ kind: "duplicate" });
      } else if (res.status === 400) {
        setState({ kind: "error" });
      } else {
        setState({ kind: "error" });
      }
    } catch {
      setState({ kind: "error" });
    }
  }

  const message =
    state.kind !== "idle" && state.kind !== "submitting"
      ? MESSAGES[state.kind]
      : null;
  const isError =
    state.kind === "empty" || state.kind === "error" || state.kind === "duplicate";

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@kitchen.com"
          value={email}
          disabled={submitting || done}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.kind !== "idle") setState({ kind: "idle" });
          }}
          aria-invalid={isError}
          aria-describedby={message ? "waitlist-status" : undefined}
          className="flex-1 rounded-md border border-line bg-well px-4 py-3 text-body text-ink placeholder:text-muted focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={submitting || done}
          className="rounded-md bg-signal px-6 py-3 font-display text-body font-semibold text-void transition-premium hover:bg-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/60 disabled:opacity-60"
        >
          {submitting ? "Adding you…" : done ? "You’re in ✓" : "Notify me"}
        </button>
      </form>
      {message && (
        <p
          id="waitlist-status"
          role="status"
          aria-live="polite"
          className={`mt-3 text-mono ${done ? "text-signal" : isError ? "text-pulse" : "text-muted"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
