"use client";

import { type FormEvent, useState } from "react";
import s from "./flow-state.module.css";
import { waitlistPayload } from "./waitlist-payload";

type FormState =
  | "idle"
  | "submitting"
  | "success"
  | "invalid"
  | "rateLimited"
  | "unavailable"
  | "error";

const MESSAGES: Record<Exclude<FormState, "idle" | "submitting">, string> = {
  success: "Thanks. Watch this inbox for Flow State access and updates.",
  invalid: "Enter a complete email address.",
  rateLimited: "Too many requests. Wait a few minutes or email us below.",
  unavailable: "The list is temporarily unavailable. Email us directly below.",
  error: "That did not go through. Try again or email us directly below.",
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const settled = state === "success";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setState("invalid");
      return;
    }

    setState("submitting");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          waitlistPayload(trimmed, new FormData(event.currentTarget)),
        ),
      });

      if (response.ok) {
        setEmail("");
        setState("success");
      } else if (response.status === 400) {
        setState("invalid");
      } else if (response.status === 429) {
        setState("rateLimited");
      } else if (response.status === 503) {
        setState("unavailable");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  const message =
    state === "idle"
      ? ""
      : state === "submitting"
        ? "Submitting request..."
        : MESSAGES[state];

  return (
    <form
      className={s.waitlistForm}
      onSubmit={submit}
      aria-busy={state === "submitting"}
      noValidate
    >
      <label className={s.emailLabel} htmlFor="flow-state-email">
        Email address
      </label>
      <input
        className={s.emailInput}
        id="flow-state-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        placeholder="you@example.com"
        value={email}
        disabled={state === "submitting" || settled}
        aria-invalid={state === "invalid"}
        aria-describedby="flow-state-form-note flow-state-form-status"
        onChange={(event) => {
          setEmail(event.target.value);
          if (state !== "idle") setState("idle");
        }}
      />
      <label className={s.honeypot} aria-hidden="true">
        Company website
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      <button
        className={`s9-pearl ${s.submitButton}`}
        type="submit"
        disabled={state === "submitting" || settled}
      >
        <span>
          {state === "submitting"
            ? "Joining..."
            : settled
              ? "Request received"
              : "Request access"}
        </span>
        <span className="s9-pearlArrow" aria-hidden="true">
          &#8594;
        </span>
      </button>
      <p className={s.formNote} id="flow-state-form-note">
        Flow State access and product updates only. Unsubscribe anytime.
      </p>
      <p
        className={s.formStatus}
        id="flow-state-form-status"
        data-kind={state}
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
