// AI.DY — Phase 4.0 verification: smoke-test the newsletter API end-to-end
// against the production build running on the local server.
//
// Usage:
//   1) pnpm start &  (in another terminal, after pnpm build)
//   2) node scripts/verify-phase4.mjs

const BASE = process.env.VERIFY_BASE_URL || "http://[::1]:3000";

function log(label, ok, detail) {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${label} — ${detail ?? ""}`);
  return ok;
}

const results = [];

async function step(name, fn) {
  try {
    const ok = await fn();
    results.push({ name, ok });
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
  }
}

await step("Subscribe new email → 201", async () => {
  const email = `phase4-verify-${Date.now()}@aidy-test.dev`;
  const res = await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, source: "verify-script" }),
  });
  const json = await res.json();
  const ok = res.status === 201 && json.ok === true;
  log(
    "Subscribe new email → 201",
    ok,
    `status=${res.status} body=${JSON.stringify(json).slice(0, 120)}`
  );
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

await step("Subscribe same email again → 200 (idempotent)", async () => {
  const email = `phase4-verify-${Date.now() - 1000}@aidy-test.dev`;
  // First insert
  await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, source: "verify-script" }),
  });
  // Second call — should be 200
  const res = await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, source: "verify-script" }),
  });
  const json = await res.json();
  const ok = res.status === 200 && json.ok === true;
  log(
    "Subscribe same email again → 200 (idempotent)",
    ok,
    `status=${res.status} body=${JSON.stringify(json).slice(0, 120)}`
  );
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

await step("Subscribe with invalid email → 422", async () => {
  const res = await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  const ok = res.status === 422;
  log("Subscribe with invalid email → 422", ok, `status=${res.status}`);
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

await step("Subscribe with empty body → 400", async () => {
  const res = await fetch(`${BASE}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "",
  });
  const ok = res.status === 400 || res.status === 422;
  log(
    "Subscribe with empty body → 4xx",
    ok,
    `status=${res.status}`
  );
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

await step("Affiliate page /tools/chatgpt → 200", async () => {
  const res = await fetch(`${BASE}/tools/chatgpt`);
  const html = await res.text();
  const ok =
    res.status === 200 &&
    html.includes("جرب الأداة بخصم") &&
    html.includes("data-affiliate-button") &&
    html.includes('rel="noopener sponsored nofollow"');
  log(
    "Affiliate page /tools/chatgpt → 200 + affiliate button + rel",
    ok,
    `status=${res.status} hasButton=${html.includes("جرب الأداة بخصم")} hasRel=${html.includes("noopener sponsored nofollow")}`
  );
  if (!ok) throw new Error("missing affiliate button or rel");
  return ok;
});

await step("Homepage → 200 + sponsored slot", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  const ok =
    res.status === 200 &&
    html.includes('data-sponsored-slot="homepage_hero"') &&
    html.includes("مُموَّل");
  log(
    "Homepage → 200 + sponsored slot + مُموَّل badge",
    ok,
    `status=${res.status} hasSlot=${html.includes('data-sponsored-slot="homepage_hero"')} hasBadge=${html.includes("مُموَّل")}`
  );
  if (!ok) throw new Error("missing sponsored slot or badge");
  return ok;
});

await step("Homepage → 200 + LeadGenCta", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  const ok =
    res.status === 200 &&
    html.includes("data-lead-gen-cta=") &&
    html.includes("wa.me/201234567890");
  log(
    "Homepage → 200 + LeadGenCta + wa.me link",
    ok,
    `status=${res.status} hasCta=${html.includes("data-lead-gen-cta=")} hasWa=${html.includes("wa.me/201234567890")}`
  );
  if (!ok) throw new Error("missing LeadGenCta");
  return ok;
});

await step("Footer has NewsletterForm + data-site-footer", async () => {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  const ok =
    res.status === 200 &&
    html.includes("data-newsletter-form") &&
    html.includes('data-site-footer') &&
    html.includes("اشترك في النشرة");
  log(
    "Footer has NewsletterForm + data-site-footer",
    ok,
    `status=${res.status} hasForm=${html.includes("data-newsletter-form")} hasFooter=${html.includes("data-site-footer")}`
  );
  if (!ok) throw new Error("missing newsletter form in footer");
  return ok;
});

await step("Category page → 200", async () => {
  const res = await fetch(`${BASE}/categories/ai-assistants`);
  const ok = res.status === 200;
  log("Category page /categories/ai-assistants → 200", ok, `status=${res.status}`);
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

await step("Use-cases page → 200", async () => {
  const res = await fetch(`${BASE}/use-cases`);
  const ok = res.status === 200;
  log("Use-cases index → 200", ok, `status=${res.status}`);
  if (!ok) throw new Error(`status=${res.status}`);
  return ok;
});

// Summary
console.log("\n=== Summary ===");
const passed = results.filter((r) => r.ok).length;
console.log(`${passed}/${results.length} checks passed`);
const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.log("\nFailures:");
  failed.forEach((r) => console.log(`  - ${r.name}${r.error ? `: ${r.error}` : ""}`));
  process.exit(1);
}
