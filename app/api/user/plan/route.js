import { NextResponse } from "next/server";
import { requireUserRecord, getUserSubscription } from "@/libs/authz";
import { handleRouteError } from "@/libs/security/http";

export async function GET() {
  try {
    const { user } = await requireUserRecord(
      "plan hasAccess customerId stripeCustomerId stripeSubscriptionId priceId stripePriceId subscriptionStatus"
    );
    const subscription = getUserSubscription(user);
    return NextResponse.json(
      { plan: subscription.plan, status: subscription.status },
      { status: 200 }
    );
  } catch (error) {
    if (error?.status === 401 || error?.status === 404) {
      return NextResponse.json({ plan: "free" }, { status: 200 });
    }

    return handleRouteError(error, { route: "user/plan" });
  }
}
