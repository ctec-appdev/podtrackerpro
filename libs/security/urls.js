import config from "@/config";

export function sanitizeCallbackPath(value, fallback = "/dashboard") {
  if (typeof value !== "string") {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function getSafeReturnPath(candidate, req, fallback = "/dashboard") {
  if (typeof candidate !== "string" || candidate.length === 0) {
    return fallback;
  }

  const requestOrigin = new URL(req.url).origin;
  const trustedOrigins = new Set([
    requestOrigin,
    `https://${config.domainName}`,
    "http://localhost:3000",
  ]);

  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate);

    if (!trustedOrigins.has(parsed.origin)) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function toAbsoluteAppUrl(pathname, req) {
  return new URL(pathname, req.url).toString();
}
