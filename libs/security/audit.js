const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|authorization|cookie|signature|prompt|system|html|text|raw)/i;

function sanitizeValue(value, depth = 0) {
  if (value == null || depth > 3) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          return [key, "[REDACTED]"];
        }

        if (key.toLowerCase().includes("email") && typeof entry === "string") {
          return [key, maskEmail(entry)];
        }

        return [key, sanitizeValue(entry, depth + 1)];
      })
    );
  }

  if (typeof value === "string" && value.length > 280) {
    return `${value.slice(0, 280)}...`;
  }

  return value;
}

function maskEmail(value) {
  const [localPart, domain] = value.split("@");

  if (!localPart || !domain) {
    return "[INVALID_EMAIL]";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function logSecurityEvent(event, details = {}, level = "info") {
  const logger = console[level] || console.info;
  logger(`[security] ${event}`, sanitizeValue(details));
}
