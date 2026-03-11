import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ plan: "free" }, { status: 200 });
  }

  await connectMongo();

  const user = await User.findById(session.user.id).select("plan hasAccess");

  if (!user || !user.hasAccess) {
    return NextResponse.json({ plan: "free" }, { status: 200 });
  }

  const plan = user.plan === "starter" || user.plan === "business" ? user.plan : "free";
  return NextResponse.json({ plan }, { status: 200 });
}
