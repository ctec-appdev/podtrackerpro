import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { isSubscriptionActive, planFromPriceId } from "./subscription";

function toDateFromUnix(timestamp) {
  if (!timestamp) {
    return null;
  }

  return new Date(timestamp * 1000);
}

export function buildBillingState({
  stripeCustomerId = null,
  stripeSubscriptionId = null,
  stripePriceId = null,
  status = "inactive",
  plan = null,
  checkoutSessionId = null,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
}) {
  const resolvedPlan = plan || planFromPriceId(stripePriceId);
  const hasAccess = isSubscriptionActive(status);

  return {
    subscription: {
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      checkoutSessionId,
      plan: resolvedPlan,
      status,
      currentPeriodEnd:
        currentPeriodEnd instanceof Date
          ? currentPeriodEnd
          : toDateFromUnix(currentPeriodEnd),
      cancelAtPeriodEnd,
    },
    user: {
      customerId: stripeCustomerId,
      stripeCustomerId,
      stripeSubscriptionId,
      priceId: stripePriceId,
      stripePriceId,
      subscriptionStatus: status,
      plan: hasAccess ? resolvedPlan : "free",
      hasAccess,
    },
  };
}

export async function findUserForBilling({
  userId = null,
  clientReferenceId = null,
  stripeCustomerId = null,
  email = null,
}) {
  if (userId || clientReferenceId) {
    return User.findById(userId || clientReferenceId);
  }

  if (stripeCustomerId) {
    return User.findOne({
      $or: [{ stripeCustomerId }, { customerId: stripeCustomerId }],
    });
  }

  if (email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  return null;
}

export async function syncStripeBillingState({
  userId = null,
  clientReferenceId = null,
  stripeCustomerId = null,
  stripeSubscriptionId = null,
  stripePriceId = null,
  status = "inactive",
  plan = null,
  email = null,
  checkoutSessionId = null,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
}) {
  // Webhook payloads do not always include the same identifiers, so we try the
  // internal user id first, then Stripe customer id, then email as a fallback.
  const user = await findUserForBilling({
    userId,
    clientReferenceId,
    stripeCustomerId,
    email,
  });

  if (!user) {
    return null;
  }

  const nextState = buildBillingState({
    stripeCustomerId,
    stripeSubscriptionId,
    stripePriceId,
    status,
    plan,
    checkoutSessionId,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  });

  user.set(nextState.user);
  await user.save();

  await Subscription.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      ...nextState.subscription,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return user;
}
