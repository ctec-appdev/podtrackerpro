import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { HttpError } from "./security/http";
import { getActiveSubscription, requireFeaturePlan } from "./subscription";

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  return session;
}

export async function requireUserRecord(select = "") {
  const session = await requireSessionUser();

  await connectMongo();

  const query = User.findById(session.user.id);
  const user = select ? await query.select(select) : await query;

  if (!user) {
    throw new HttpError(404, "User record not found. Please sign in again.");
  }

  return { session, user };
}

export async function requireFeatureAccess(feature, select = "") {
  const { session, user } = await requireUserRecord(select);
  const subscription = requireFeaturePlan(feature, user);

  return { session, user, subscription };
}

export function getUserSubscription(user) {
  return getActiveSubscription(user);
}
