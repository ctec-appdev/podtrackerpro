import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_TO_PLAN = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY]: "starter",
  [process.env.STRIPE_PRICE_BUSINESS_MONTHLY]: "business",
};

function planFromPriceId(priceId) {
  if (!priceId) return "free";
  return PRICE_TO_PLAN[priceId] || "free";
}

function updateFromPlan(plan, extra = {}) {
  return {
    ...extra,
    plan,
    hasAccess: plan !== "free",
  };
}

function planFromSubscription(subscription) {
  const priceId = subscription?.items?.data?.[0]?.price?.id || null;
  const activeStatuses = new Set(["active", "trialing"]);
  const plan = activeStatuses.has(subscription?.status)
    ? planFromPriceId(priceId)
    : "free";

  return {
    priceId,
    plan,
  };
}

async function findPriceIdFromCheckoutSession(sessionId) {
  const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });

  return fullSession?.line_items?.data?.[0]?.price?.id || null;
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  await connectMongo();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId = session.customer || null;
      const clientReferenceId = session.client_reference_id || null;

      let priceId = session?.line_items?.data?.[0]?.price?.id || null;
      if (!priceId) {
        try {
          priceId = await findPriceIdFromCheckoutSession(session.id);
        } catch (e) {
          console.error("Failed to resolve checkout session price:", e.message);
        }
      }

      const plan = planFromPriceId(priceId);
      const update = updateFromPlan(plan, { customerId, priceId });

      if (clientReferenceId) {
        await User.findByIdAndUpdate(clientReferenceId, update, { new: true });
      } else if (customerId) {
        await User.findOneAndUpdate({ customerId }, update, { new: true });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const priceId = invoice.lines?.data?.[0]?.price?.id || null;
      const plan = planFromPriceId(priceId);

      await User.findOneAndUpdate(
        { customerId },
        updateFromPlan(plan, {
          ...(priceId ? { priceId } : {}),
        })
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const { priceId, plan } = planFromSubscription(subscription);

      await User.findOneAndUpdate(
        { customerId },
        updateFromPlan(plan, { ...(priceId ? { priceId } : {}) })
      );
      break;
    }

    case "invoice.payment_failed": {
      // Stripe can recover failed charges via retries, so don't revoke access yet.
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = event.data.object.customer;
      await User.findOneAndUpdate({ customerId }, updateFromPlan("free"));
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
