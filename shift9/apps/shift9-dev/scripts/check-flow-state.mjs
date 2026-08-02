import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath) {
  const absolutePath = join(appRoot, relativePath);
  assert.ok(existsSync(absolutePath), `Missing ${relativePath}`);
  return readFileSync(absolutePath, "utf8");
}

const route = read("app/api/waitlist/route.ts");
const policy = read("app/api/waitlist/waitlist-policy.ts");
const confirmationEmail = read("app/api/waitlist/confirmation-email.ts");
const page = read("app/flow-state/page.tsx");
const form = read("app/flow-state/WaitlistForm.tsx");
const payload = read("app/flow-state/waitlist-payload.ts");
const demo = read("app/flow-state/FlowStateDemo.tsx");
const water = read("app/flow-state/WaterSurface.tsx");
const styles = read("app/flow-state/flow-state.module.css");
const dolly = read("app/_components/studio-dolly-data.ts");
const themeTokens = read("../../packages/theme/tokens.css");
const waitlistMigration = read(
  "../../supabase/migrations/20260731_waitlist_email_source_uniqueness.sql",
);
const waitlistSourceMigration = read(
  "../../supabase/migrations/20260731_waitlist_source_nonempty.sql",
);
const deploymentGuide = read("../../DEPLOY.md");

const routeAst = ts.createSourceFile(
  "route.ts",
  route,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
const waitlistCalls = [];
function visit(node) {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "addToWaitlist"
  ) {
    waitlistCalls.push(node);
  }
  ts.forEachChild(node, visit);
}
visit(routeAst);

assert.equal(waitlistCalls.length, 1, "Expected one executable addToWaitlist call");
const [emailArgument, sourceArgument] = waitlistCalls[0].arguments;
assert.ok(
  emailArgument && ts.isIdentifier(emailArgument) && emailArgument.text === "email",
  "The route must submit the validated email variable",
);
assert.ok(
  sourceArgument &&
    ts.isStringLiteral(sourceArgument) &&
    sourceArgument.text === "flow-state",
  "Flow State signups must keep the flow-state source tag",
);

const compiledPolicy = ts.transpileModule(policy, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const policyModule = { exports: {} };
new Function("module", "exports", compiledPolicy)(
  policyModule,
  policyModule.exports,
);
const { createRateLimiter, publicWaitlistResponse } = policyModule.exports;

const compiledPayload = ts.transpileModule(payload, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const payloadModule = { exports: {} };
new Function("module", "exports", compiledPayload)(
  payloadModule,
  payloadModule.exports,
);
const payloadData = new FormData();
payloadData.set("website", "filled-by-a-bot.example");
assert.deepEqual(
  payloadModule.exports.waitlistPayload("person@example.com", payloadData),
  {
    email: "person@example.com",
    website: "filled-by-a-bot.example",
  },
  "The browser payload must carry the actual honeypot value",
);
assert.equal(
  payloadModule.exports.waitlistSuccessState("sent"),
  "success",
  "A delivered confirmation must show the inbox message",
);
assert.equal(
  payloadModule.exports.waitlistSuccessState("unavailable"),
  "saved",
  "A mail failure must still acknowledge the saved waitlist place",
);

const compiledConfirmation = ts.transpileModule(confirmationEmail, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const confirmationModule = { exports: {} };
new Function("module", "exports", compiledConfirmation)(
  confirmationModule,
  confirmationModule.exports,
);
const {
  flowStateConfirmationIdempotencyKey,
  sendFlowStateConfirmation,
} = confirmationModule.exports;

let sentRequest;
const confirmationResult = await sendFlowStateConfirmation(
  "Person@Example.com ",
  {
    apiKey: "test-api-key",
    signal: new AbortController().signal,
    fetcher: async (url, options) => {
      sentRequest = { url, options };
      return { ok: true };
    },
  },
);
assert.equal(confirmationResult, "sent");
assert.equal(sentRequest.url, "https://api.resend.com/emails");
const sentHeaders = new Headers(sentRequest.options.headers);
assert.equal(sentHeaders.get("Authorization"), "Bearer test-api-key");
assert.equal(sentHeaders.get("User-Agent"), "shift9.dev/flow-state");
assert.equal(
  sentHeaders.get("Idempotency-Key"),
  await flowStateConfirmationIdempotencyKey(" person@example.com"),
  "Equivalent email casing and whitespace must share one delivery key",
);
const sentBody = JSON.parse(sentRequest.options.body);
assert.deepEqual(sentBody.to, ["Person@Example.com"]);
assert.equal(sentBody.from, "Flow State <updates@shift9.dev>");
assert.equal(sentBody.reply_to, "shift9dev@gmail.com");
assert.match(sentBody.subject, /Flow State private beta list/);

let unconfiguredFetchCalled = false;
assert.equal(
  await sendFlowStateConfirmation("person@example.com", {
    apiKey: "",
    fetcher: async () => {
      unconfiguredFetchCalled = true;
      return { ok: true };
    },
  }),
  "unconfigured",
);
assert.equal(
  unconfiguredFetchCalled,
  false,
  "A missing key must never make a network request",
);
assert.equal(
  await sendFlowStateConfirmation("person@example.com", {
    apiKey: "test-api-key",
    signal: new AbortController().signal,
    fetcher: async () => ({ ok: false }),
  }),
  "rejected",
);

assert.deepEqual(publicWaitlistResponse({ ok: true }), {
  body: { ok: true },
  status: 200,
});
assert.deepEqual(
  publicWaitlistResponse({ ok: false, reason: "duplicate" }),
  { body: { ok: true }, status: 200 },
  "Duplicate membership must not be exposed publicly",
);
assert.equal(
  publicWaitlistResponse({ ok: false, reason: "invalid" }).status,
  400,
);
assert.equal(
  publicWaitlistResponse({ ok: false, reason: "unconfigured" }).status,
  503,
);
assert.equal(
  publicWaitlistResponse({ ok: false, reason: "error" }).status,
  500,
);

const limited = createRateLimiter({ windowMs: 100, maxRequests: 2, maxBuckets: 2 });
assert.equal(limited("first", 0), false);
assert.equal(limited("first", 1), false);
assert.equal(limited("first", 2), true);
assert.equal(limited("first", 101), false, "Expired buckets must reset");
assert.equal(limited("second", 102), false);
assert.equal(limited("third", 103), false, "Bucket storage must stay bounded");
assert.equal(limited("first", 104), false);
assert.equal(
  limited("first", 105),
  false,
  "Revisiting an evicted key must start a fresh request window",
);
assert.match(
  dolly,
  /title:\s*"Flow State"[\s\S]*?href:\s*"\/flow-state"/,
  "The studio Flow State entry must open the dedicated page",
);
assert.match(page, /Local Windows Dictation/i);
assert.match(page, /<WaterSurface/, "Flow State must keep the full-page water surface");
assert.match(page, /logoJewel/, "Flow State must keep the jewel-F header mark");
assert.match(form, /aria-live="polite"/);
assert.match(form, /type="email"/);
assert.match(form, /Check your inbox for confirmation/);
assert.match(form, /your place is saved/);
assert.match(
  route,
  /addToWaitlist\(email, "flow-state"\)[\s\S]{0,180}publicWaitlistResponse\(result\)[\s\S]{0,220}if \(!response\.body\.ok\)[\s\S]{0,320}sendFlowStateConfirmation\(email\)/,
  "Confirmation must run only after the waitlist accepts the address",
);
assert.doesNotMatch(
  confirmationEmail,
  /re_[A-Za-z0-9]{16,}/,
  "The Resend key must stay in server environment configuration",
);
assert.match(demo, /useReducedMotionSafe/);
assert.match(water, /prefers-reduced-motion: reduce/, "The water surface must respect reduced motion");
assert.match(water, /requestAnimationFrame/, "The water surface must render a live ripple field");
assert.match(water, /cancelAnimationFrame/, "The water animation loop must terminate cleanly");
assert.match(water, /\(pointer: fine\)/, "Water interaction must run only for fine pointers");
assert.match(water, /pointerQuery\.matches\s*&&\s*!motionQuery\.matches/, "Water interaction must stop for reduced motion");
assert.match(water, /if \(motionQuery\.matches\) paint\(0\)/, "Reduced-motion water must repaint after resize");
assert.doesNotMatch(water, /rgba?\(/i, "Canvas colors must come from Shift-9 theme tokens");
assert.match(styles, /prefers-reduced-motion/);
assert.match(
  styles,
  /\.topbar\s*\{[\s\S]{0,220}padding:[^;]*clamp\(11\.75rem,\s*16vw,\s*14rem\)/,
  "The Flow State header must clear the fixed studio return control",
);
assert.match(
  themeTokens,
  /--s9-holofoil:\s*[\s\S]*linear-gradient/i,
  "The Flow State mark needs a tokenized holofoil material",
);
assert.match(
  deploymentGuide,
  /shift9\.dev[\s\S]*NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_ANON_KEY[\s\S]*Flow State beta intake/i,
  "Shift-9 deployment docs must keep the Flow State intake configuration explicit",
);
assert.match(
  deploymentGuide,
  /RESEND_API_KEY[\s\S]*confirmation email/i,
  "Shift-9 deployment docs must name the server-only confirmation sender key",
);
assert.match(
  deploymentGuide,
  /Table Editor[\s\S]*waitlist[\s\S]*source[\s\S]*flow-state/i,
  "The owner handoff must explain how to inspect Flow State signups privately",
);
assert.match(
  styles,
  /\.fMark\s+span\s*\{[\s\S]*?background-image:\s*var\(--s9-holofoil\)/i,
  "The standalone F must use holofoil instead of titanium",
);
assert.match(
  waitlistMigration,
  /alter\s+table\s+public\.waitlist[\s\S]*alter\s+column\s+source\s+set\s+not\s+null/i,
  "Waitlist product membership requires a source",
);
assert.match(
  waitlistMigration,
  /create\s+unique\s+index\s+waitlist_email_source_key\s+on\s+public\.waitlist\s*\(\s*lower\s*\(\s*email\s*\)\s*,\s*source\s*\)/i,
  "Waitlist uniqueness must be scoped to email and product source",
);
assert.match(
  waitlistMigration,
  /drop\s+index\s+public\.waitlist_email_key/i,
  "The old email-only waitlist index must be removed",
);
assert.match(
  waitlistSourceMigration,
  /alter\s+table\s+public\.waitlist[\s\S]*add\s+constraint\s+waitlist_source_nonempty[\s\S]*length\s*\(\s*btrim\s*\(\s*source\s*\)\s*\)\s*>\s*0/i,
  "Waitlist source tags must not be blank",
);

const pageSurface = `${page}\n${form}\n${demo}\n${styles}`;
assert.doesNotMatch(
  pageSurface,
  /project\s*(?:number|no\.?|#)?\s*\d+/i,
  "The Flow State page must not present a project number",
);
assert.doesNotMatch(
  `${page}\n${demo}\n${form}`,
  /prototype|\bTODO\b|\bdraft\b|review note|automated test suite/i,
  "The public Flow State page must contain only customer-facing product copy",
);

console.log("Flow State route, waitlist, motion, and studio-link contracts pass.");
