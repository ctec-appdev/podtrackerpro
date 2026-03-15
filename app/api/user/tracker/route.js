import { NextResponse } from "next/server";
import { requireUserRecord } from "@/libs/authz";
import connectMongo from "@/libs/mongoose";
import TrackerState from "@/models/TrackerState";
import { handleRouteError, HttpError } from "@/libs/security/http";

const TRACKER_KEYS = ["niches", "keywords", "trends", "briefs", "seo", "ideas", "opportunityTrees", "customNiches", "nicheProfiles", "inventory", "performance"];

function emptyTrackerState() {
  return Object.fromEntries(TRACKER_KEYS.map((key) => [key, []]));
}

function sanitizeTrackerPayload(payload) {
  const sanitized = {};

  for (const key of TRACKER_KEYS) {
    const value = payload?.[key];
    if (value === undefined) continue;

    if (!Array.isArray(value)) {
      throw new HttpError(400, `Invalid tracker payload for "${key}".`);
    }

    sanitized[key] = value;
  }

  return sanitized;
}

export async function GET() {
  try {
    const { user } = await requireUserRecord("_id");
    await connectMongo();

    const tracker = await TrackerState.findOne({ user: user._id });

    return NextResponse.json(
      {
        tracker: tracker
          ? TRACKER_KEYS.reduce((acc, key) => {
              acc[key] = Array.isArray(tracker[key]) ? tracker[key] : [];
              return acc;
            }, {})
          : emptyTrackerState(),
        exists: !!tracker,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, { route: "user/tracker.get" });
  }
}

export async function PUT(req) {
  try {
    const { user } = await requireUserRecord("_id");
    const body = await req.json();
    const updates = sanitizeTrackerPayload(body?.tracker || body);

    await connectMongo();

    const tracker = await TrackerState.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          user: user._id,
          ...updates,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(
      {
        tracker: TRACKER_KEYS.reduce((acc, key) => {
          acc[key] = Array.isArray(tracker[key]) ? tracker[key] : [];
          return acc;
        }, {}),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, { route: "user/tracker.put" });
  }
}
