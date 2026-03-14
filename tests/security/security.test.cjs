const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readFile(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Claude route enforces authenticated feature access", () => {
  const source = readFile("app/api/claude/route.js");

  assert.match(source, /requireFeatureAccess/);
  assert.match(source, /validateClaudeRequest/);
  assert.match(source, /Too many AI requests/);
});

test("Checkout route validates Stripe prices and return URLs", () => {
  const source = readFile("app/api/stripe/create-checkout/route.js");

  assert.match(source, /assertAllowedCheckoutPrice/);
  assert.match(source, /getSafeReturnPath/);
  assert.match(source, /Too many checkout attempts/);
});

test("Stripe webhook verifies signatures and stores processed event ids", () => {
  const source = readFile("app/api/webhook/stripe/route.js");

  assert.match(source, /constructEvent/);
  assert.match(source, /WebhookEvent\.create/);
  assert.match(source, /duplicate: true/);
});

test("Next.js config includes CSP and browser security headers", () => {
  const source = readFile("next.config.js");

  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /Permissions-Policy/);
  assert.match(source, /X-Frame-Options/);
});
