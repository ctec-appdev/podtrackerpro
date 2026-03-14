import { NextResponse } from "next/server";
import { logSecurityEvent } from "./audit";

export class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
  }
}

export function jsonError(message, status, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleRouteError(error, context = {}) {
  if (error instanceof HttpError) {
    if (error.status >= 400) {
      logSecurityEvent("route.error", {
        ...context,
        status: error.status,
        message: error.message,
        details: error.details,
      });
    }

    return jsonError(error.message, error.status);
  }

  logSecurityEvent("route.unhandled_error", {
    ...context,
    message: error?.message || "Unhandled server error",
  });

  return jsonError("Internal server error", 500);
}
