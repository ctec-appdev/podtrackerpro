import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/libs/authz";
import { handleRouteError } from "@/libs/security/http";

export async function GET() {
  try {
    const session = await requireSessionUser();
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
  } catch (error) {
    if (error?.status === 401) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return handleRouteError(error, { route: "canny/identify" });
  }
}
