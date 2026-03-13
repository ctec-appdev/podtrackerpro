import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectMongo();

  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: { name: name.slice(0, 80) } },
    { new: true, select: "id name email" }
  );

  return NextResponse.json({ user }, { status: 200 });
}
