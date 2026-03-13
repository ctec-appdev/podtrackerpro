import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const name = session.user.name || session.user.email || "PODTrackerPro User";
  const email = session.user.email || "";
  const id = String(session.user.id);
  const apiKey = process.env.CANNY_API_KEY || "";

  const user = {
    id,
    name,
    email,
  };

  const payload = { user };

  if (apiKey) {
    payload.hash = crypto.createHmac("sha256", apiKey).update(id).digest("hex");
  }

  return NextResponse.json(payload, { status: 200 });
}
