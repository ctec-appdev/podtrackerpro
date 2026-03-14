import { NextResponse } from "next/server";
import { requireUserRecord } from "@/libs/authz";
import { consumeRateLimit, getRequestIdentifier } from "@/libs/security/rate-limit";
import { assertValidDisplayName } from "@/libs/security/validation";
import { handleRouteError, HttpError } from "@/libs/security/http";
import { logSecurityEvent } from "@/libs/security/audit";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user } = await requireUserRecord("name email");
    const requester = getRequestIdentifier(req, user.id);
    const rateLimit = consumeRateLimit({
      key: `profile:${requester}`,
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many profile updates. Please wait a minute.");
    }

    const name = assertValidDisplayName(body?.name);
    user.name = name;
    await user.save();

    logSecurityEvent("profile.updated", { userId: user.id });

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, { route: "user/profile" });
  }
}
