import { NextResponse } from "next/server";
import { requireUserRecord } from "@/libs/authz";
import { createCustomerPortal } from "@/libs/stripe";
import { getRequestIdentifier, consumeRateLimit } from "@/libs/security/rate-limit";
import { getSafeReturnPath, toAbsoluteAppUrl } from "@/libs/security/urls";
import { handleRouteError, HttpError } from "@/libs/security/http";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user } = await requireUserRecord();
    const requester = getRequestIdentifier(req, user.id);
    const rateLimit = consumeRateLimit({
      key: `billing-portal:${requester}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many billing portal requests. Please wait a minute.");
    }

    const customerId = user?.stripeCustomerId || user?.customerId;

    if (!customerId) {
      throw new HttpError(
        400,
        "You don't have a billing account yet. Make a purchase first."
      );
    }

    const returnPath = getSafeReturnPath(body?.returnUrl, req, "/dashboard");
    const stripePortalUrl = await createCustomerPortal({
      customerId,
      returnUrl: toAbsoluteAppUrl(returnPath, req),
    });

    if (!stripePortalUrl) {
      throw new HttpError(502, "Unable to create billing portal session.");
    }

    return NextResponse.json({
      url: stripePortalUrl,
    });
  } catch (error) {
    return handleRouteError(error, { route: "stripe/create-portal" });
  }
}
