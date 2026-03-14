import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import WebhookEvent from "@/models/WebhookEvent";
import { getStripe } from "@/libs/stripe";
import { syncStripeBillingState } from "@/libs/billing-state";
import { planFromPriceId } from "@/libs/subscription";
import { logSecurityEvent } from "@/libs/security/audit";

function planFromSubscription(subscription) {
  const priceId = subscription?.items?.data?.[0]?.price?.id || null;
  const plan = planFromPriceId(priceId);

  return {
    priceId,
    plan,
  };
}

async function getExpandedSubscription(subscriptionId) {
  if (!subscriptionId) {
    return null;
  }

  return getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    // Stripe signs the raw payload so we verify the signature before touching billing state.
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Missing Stripe webhook signature or secret.");
    }

    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    logSecurityEvent("billing.webhook_signature_failed", {
      provider: "stripe",
      message: e.message,
    });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  await connectMongo();

  try {
    // Persist the event id up front so retries do not double-apply subscription changes.
    await WebhookEvent.create({
      provider: "stripe",
      eventId: event.id,
      type: event.type,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    logSecurityEvent("billing.webhook_dedup_failed", {
      provider: "stripe",
      eventId: event.id,
      message: error?.message,
    });
    return NextResponse.json({ error: "Webhook persistence failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscription = await getExpandedSubscription(session.subscription);
        const priceId =
          subscription?.items?.data?.[0]?.price?.id ||
          session?.metadata?.priceId ||
          null;
        const plan = session?.metadata?.selectedPlan || planFromPriceId(priceId);
        const syncedUser = await syncStripeBillingState({
          clientReferenceId: session.client_reference_id || session?.metadata?.userId,
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
          stripePriceId: priceId,
          status: subscription?.status || "incomplete",
          plan,
          email: session.customer_details?.email || session?.metadata?.email || null,
          checkoutSessionId: session.id,
          currentPeriodEnd: subscription?.current_period_end || null,
          cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
        });

        if (!syncedUser) {
          throw new Error(`Unable to map Checkout Session ${session.id} to a user record.`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const { priceId, plan } = planFromSubscription(subscription);
        const syncedUser = await syncStripeBillingState({
          stripeCustomerId: subscription.customer || null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status || "inactive",
          plan,
          currentPeriodEnd: subscription.current_period_end || null,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        });

        if (!syncedUser) {
          throw new Error(
            `Unable to map Stripe subscription ${subscription.id} to a user record.`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { priceId, plan } = planFromSubscription(subscription);
        const syncedUser = await syncStripeBillingState({
          stripeCustomerId: subscription.customer || null,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status || "canceled",
          plan,
          currentPeriodEnd: subscription.current_period_end || null,
          cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        });

        if (!syncedUser) {
          throw new Error(
            `Unable to map deleted Stripe subscription ${subscription.id} to a user record.`
          );
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    try {
      await WebhookEvent.deleteOne({ provider: "stripe", eventId: event.id });
    } catch (cleanupError) {
      logSecurityEvent("billing.webhook_cleanup_failed", {
        provider: "stripe",
        eventId: event.id,
        message: cleanupError?.message,
      });
    }
    logSecurityEvent("billing.webhook_handler_failed", {
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      message: error?.message,
    });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
