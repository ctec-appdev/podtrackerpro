import { NextResponse } from "next/server";
import { requireUserRecord } from "@/libs/authz";
import { createCheckoutSession, ensureStripeCustomer } from "@/libs/stripe";
import { handleRouteError, HttpError } from "@/libs/security/http";
import { getRequestIdentifier, consumeRateLimit } from "@/libs/security/rate-limit";
import { assertAllowedCheckoutSelection } from "@/libs/subscription";
import { logSecurityEvent } from "@/libs/security/audit";

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://app.podtrackerpro.com").replace(
    /\/+$/,
    ""
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { user } = await requireUserRecord(
      "name email customerId stripeCustomerId"
    );
    const requester = getRequestIdentifier(req, user.id);
    const rateLimit = consumeRateLimit({
      key: `checkout:${requester}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many checkout attempts. Please wait a minute.");
    }

    const { priceId, plan, mode } = body || {};
    const checkoutPlan = assertAllowedCheckoutSelection({ plan, priceId });

    if (mode && mode !== checkoutPlan.mode) {
      throw new HttpError(400, "Invalid checkout mode for the selected plan.");
    }

    // Reuse the Stripe customer when it already exists so repeat upgrades stay tied to the same record.
    const stripeCustomerId = await ensureStripeCustomer({ user });
    const stripeSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      customerEmail: user.email,
      priceId: checkoutPlan.priceId,
      plan: checkoutPlan.plan,
      successUrl: `${getAppUrl()}/dashboard?checkout=success`,
      cancelUrl: `${getAppUrl()}/pricing?checkout=cancelled`,
      clientReferenceId: user?._id?.toString(),
      userEmail: user?.email || "",
    });

    if (!stripeSession?.url) {
      throw new HttpError(502, "Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: stripeSession.url, sessionId: stripeSession.id });
  } catch (error) {
    logSecurityEvent("billing.checkout_rejected", {
      path: req.nextUrl.pathname,
      message: error?.message,
    });
    return handleRouteError(error, { route: "stripe/create-checkout" });
  }
}
