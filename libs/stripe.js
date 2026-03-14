import Stripe from "stripe";

let stripeClient;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Stripe environment variable: ${name}`);
  }

  return value;
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-02-25.clover",
    });
  }

  return stripeClient;
}

export async function ensureStripeCustomer({ user }) {
  const existingCustomerId = user?.stripeCustomerId || user?.customerId || null;

  if (existingCustomerId) {
    return existingCustomerId;
  }

  // Creating the customer server-side lets us store the Stripe customer id
  // before Checkout starts, which makes webhook reconciliation more reliable.
  const customer = await getStripe().customers.create({
    email: user?.email || undefined,
    name: user?.name || undefined,
    metadata: {
      userId: user?._id?.toString() || "",
      app: "PODTrackerPro",
    },
  });

  user.stripeCustomerId = customer.id;
  user.customerId = customer.id;
  await user.save();

  return customer.id;
}

// Creates a Stripe-hosted Checkout Session for subscription billing.
export async function createCheckoutSession({
  customerId,
  customerEmail,
  priceId,
  plan,
  successUrl,
  cancelUrl,
  clientReferenceId,
  userEmail,
}) {
  return getStripe().checkout.sessions.create({
    mode: "subscription",
    allow_promotion_codes: true,
    customer: customerId || undefined,
    customer_email: customerId ? undefined : customerEmail || undefined,
    client_reference_id: clientReferenceId,
    metadata: {
      userId: clientReferenceId,
      email: userEmail || "",
      selectedPlan: plan,
      priceId,
    },
    subscription_data: {
      metadata: {
        userId: clientReferenceId,
        email: userEmail || "",
        selectedPlan: plan,
        priceId,
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    tax_id_collection: { enabled: true },
  });
}

// This is used to create Customer Portal sessions, so users can manage their subscriptions (payment methods, cancel, etc..)
export const createCustomerPortal = async ({ customerId, returnUrl }) => {
  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return portalSession.url;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// This is used to get the user checkout session and populate the data so we get the planId the user subscribed to
export const findCheckoutSession = async (sessionId) => {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return session;
  } catch (e) {
    console.error(e);
    return null;
  }
};
