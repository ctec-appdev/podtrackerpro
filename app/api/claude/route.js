import { NextResponse } from "next/server";
import { requireFeatureAccess } from "@/libs/authz";
import { FEATURE_RATE_LIMITS } from "@/libs/subscription";
import { consumeRateLimit, getRequestIdentifier } from "@/libs/security/rate-limit";
import { handleRouteError, HttpError } from "@/libs/security/http";
import { validateClaudeRequest } from "@/libs/security/validation";
import { logSecurityEvent } from "@/libs/security/audit";

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new HttpError(500, "ANTHROPIC_API_KEY is missing in environment variables.");
    }

    const body = await req.json();
    const payload = validateClaudeRequest(body);
    const { user } = await requireFeatureAccess(payload.feature, "plan hasAccess");
    const requester = getRequestIdentifier(req, user.id);
    const rateConfig = FEATURE_RATE_LIMITS[payload.feature];
    const rateLimit = consumeRateLimit({
      key: `claude:${payload.feature}:${requester}`,
      limit: rateConfig.limit,
      windowMs: rateConfig.windowMs,
    });

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many AI requests. Please wait before trying again.");
    }

    const response = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: payload.model,
        max_tokens: payload.max_tokens,
        system: payload.system,
        messages: [{ role: "user", content: payload.prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logSecurityEvent("ai.provider_failure", {
        feature: payload.feature,
        status: response.status,
      });
      throw new HttpError(response.status, data?.error?.message || "Claude request failed.");
    }

    const text =
      data?.content?.map((block) => block?.text || "").join("\n") || "";

    return NextResponse.json({ text });
  } catch (error) {
    return handleRouteError(error, { route: "claude" });
  }
}
