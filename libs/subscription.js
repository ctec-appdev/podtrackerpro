import config from "@/config";
import { HttpError } from "./security/http";

export const PLAN_ORDER = {
  free: 0,
  starter: 1,
  business: 2,
};

export const FEATURE_MINIMUM_PLAN = {
  dceb: "starter",
  keywordAI: "starter",
  seo: "starter",
  trademark: "starter",
  trendScan: "business",
  briefs: "business",
  research: "business",
};

export const FEATURE_RATE_LIMITS = {
  dceb: { limit: 12, windowMs: 60 * 1000 },
  keywordAI: { limit: 8, windowMs: 60 * 1000 },
  seo: { limit: 8, windowMs: 60 * 1000 },
  trademark: { limit: 8, windowMs: 60 * 1000 },
  trendScan: { limit: 6, windowMs: 60 * 1000 },
  briefs: { limit: 6, windowMs: 60 * 1000 },
  research: { limit: 6, windowMs: 60 * 1000 },
};

const STRIPE_PRICE_ENV_BY_PLAN = {
  starter: "STRIPE_PRICE_STARTER_MONTHLY",
  business: "STRIPE_PRICE_BUSINESS_MONTHLY",
};

const paidPlans = config.stripe.plans.filter((plan) => !plan.isFree && plan.key);

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function getStripePriceIdForPlan(plan) {
  const envKey = STRIPE_PRICE_ENV_BY_PLAN[plan];
  const priceId = envKey ? process.env[envKey] : null;

  if (!priceId) {
    throw new HttpError(
      500,
      `Missing Stripe price configuration for the ${plan} plan.`
    );
  }

  return priceId;
}

export function getStripePriceMap() {
  return Object.fromEntries(
    paidPlans.map((plan) => [getStripePriceIdForPlan(plan.key), plan.key])
  );
}

export function normalizePlan(plan, hasAccess = true) {
  if (!hasAccess) {
    return "free";
  }

  return plan === "starter" || plan === "business" ? plan : "free";
}

export function getActiveSubscription(user) {
  const plan = normalizePlan(user?.plan, Boolean(user?.hasAccess));

  return {
    plan,
    hasAccess: plan !== "free",
    status: user?.subscriptionStatus || "inactive",
    customerId: user?.stripeCustomerId || user?.customerId || null,
    subscriptionId: user?.stripeSubscriptionId || null,
    priceId: user?.stripePriceId || user?.priceId || null,
  };
}

export function hasPlanAccess(plan, minimumPlan) {
  const normalizedPlan = normalizePlan(plan, true);
  const required = PLAN_ORDER[minimumPlan] ?? PLAN_ORDER.free;

  return (PLAN_ORDER[normalizedPlan] ?? PLAN_ORDER.free) >= required;
}

export function requireFeaturePlan(feature, user) {
  const minimumPlan = FEATURE_MINIMUM_PLAN[feature];
  const subscription = getActiveSubscription(user);

  if (!minimumPlan) {
    throw new HttpError(400, "Unknown subscription feature.");
  }

  if (!hasPlanAccess(subscription.plan, minimumPlan)) {
    throw new HttpError(403, "Your subscription does not include this feature.");
  }

  return subscription;
}

export function isSubscriptionActive(status) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status);
}

export function assertAllowedCheckoutPlan(plan) {
  if (!paidPlans.some((item) => item.key === plan)) {
    throw new HttpError(400, "Unknown subscription plan.");
  }

  return {
    priceId: getStripePriceIdForPlan(plan),
    plan,
    mode: "subscription",
  };
}

export function assertAllowedCheckoutSelection({ plan, priceId }) {
  if (plan) {
    const checkoutPlan = assertAllowedCheckoutPlan(plan);

    if (priceId && checkoutPlan.priceId !== priceId) {
      throw new HttpError(400, "Selected plan does not match the submitted price.");
    }

    return checkoutPlan;
  }

  const priceMap = getStripePriceMap();

  if (!priceId || !priceMap[priceId]) {
    throw new HttpError(400, "Unknown Stripe price.");
  }

  return {
    priceId,
    plan: priceMap[priceId],
    mode: "subscription",
  };
}

export function planFromPriceId(priceId) {
  return getStripePriceMap()[priceId] || "free";
}
