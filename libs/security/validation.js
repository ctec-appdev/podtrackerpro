import { HttpError } from "./http";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CLAUDE_MODELS = new Set(["claude-3-5-haiku-latest"]);
const ALLOWED_AI_FEATURES = new Set([
  "dceb",
  "keywordAI",
  "trendScan",
  "briefs",
  "seo",
  "trademark",
  "research",
]);

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function assertValidEmail(value, fieldName = "email") {
  const normalized = normalizeEmail(value);

  if (!EMAIL_PATTERN.test(normalized)) {
    throw new HttpError(400, `Invalid ${fieldName}.`);
  }

  return normalized;
}

export function normalizeDisplayName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function assertValidDisplayName(value) {
  const normalized = normalizeDisplayName(value);

  if (!normalized) {
    throw new HttpError(400, "Name is required.");
  }

  return normalized;
}

export function parseJsonBody(body) {
  return body && typeof body === "object" ? body : {};
}

export function validateClaudeRequest(body) {
  const prompt =
    typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
  const system =
    typeof body?.system === "string" ? body.system.trim().slice(0, 4000) : "";
  const feature = typeof body?.feature === "string" ? body.feature.trim() : "";
  const model = typeof body?.model === "string" ? body.model : "claude-3-5-haiku-latest";
  const maxTokens = Number.isFinite(body?.max_tokens)
    ? Math.min(Math.max(Number(body.max_tokens), 1), 1000)
    : 1000;

  if (!prompt) {
    throw new HttpError(400, "prompt is required and must be a string.");
  }

  if (!ALLOWED_AI_FEATURES.has(feature)) {
    throw new HttpError(400, "feature is required and must be a known AI feature.");
  }

  if (!ALLOWED_CLAUDE_MODELS.has(model)) {
    throw new HttpError(400, "Unsupported Claude model.");
  }

  return {
    prompt,
    system,
    feature,
    model,
    max_tokens: maxTokens,
  };
}
