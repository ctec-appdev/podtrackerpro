import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Lead from "@/models/Lead";
import { assertValidEmail } from "@/libs/security/validation";
import { consumeRateLimit, getRequestIdentifier } from "@/libs/security/rate-limit";
import { handleRouteError, HttpError } from "@/libs/security/http";
import { logSecurityEvent } from "@/libs/security/audit";

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
// Duplicate emails just return 200 OK
export async function POST(req) {
  try {
    const rateLimit = consumeRateLimit({
      key: `lead:${getRequestIdentifier(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      throw new HttpError(429, "Too many signup attempts. Please try again later.");
    }

    const body = await req.json();
    const email = assertValidEmail(body?.email);
    await connectMongo();

    // Here you can add your own logic
    // For instance, sending a welcome email (use the the sendEmail helper function from /libs/resend)
    // For instance, saving the lead in the database (uncomment the code below)
    await Lead.updateOne(
      { email },
      { $setOnInsert: { email } },
      { upsert: true }
    );

    logSecurityEvent("lead.captured", { email });

    return NextResponse.json({});
  } catch (error) {
    return handleRouteError(error, { route: "lead" });
  }
}
