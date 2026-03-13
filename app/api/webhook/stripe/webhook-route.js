import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_TO_PLAN = {
  price_1TAFHTK0qFDtdaYnmboXMnVK: "starter",
  price_1TAFMYK0qFDtdaYnSQNCHQzc: "business",
};

export async function POST(req) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  await connectMongo();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const customerId = session.customer;

        if (!userId) {
          console.error("No client_reference_id in checkout session");
          break;
        }

        // Determine plan from the subscription's price ID
        let plan = "starter";
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          const priceId = subscription.items.data[0]?.price?.id;
          plan = PRICE_TO_PLAN[priceId] || "starter";
        }

        await User.findByIdAndUpdate(userId, {
          plan,
          customerId,
        });

        console.log(`User ${userId} upgraded to ${plan}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = PRICE_TO_PLAN[priceId] || "starter";

        // Handle upgrade/downgrade between plans
        if (subscription.status === "active") {
          await User.findOneAndUpdate({ customerId }, { plan });
          console.log(`Customer ${customerId} plan updated to ${plan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await User.findOneAndUpdate({ customerId }, { plan: "free" });
        console.log(`Customer ${customerId} downgraded to free (subscription cancelled)`);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
