import { NextResponse } from "next/server";

const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 1000;

export async function POST(req) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is missing in environment variables." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body?.prompt;
    const system = body?.system;
    const model = body?.model || DEFAULT_MODEL;
    const max_tokens = body?.max_tokens || DEFAULT_MAX_TOKENS;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required and must be a string." },
        { status: 400 }
      );
    }

    const response = await fetch(CLAUDE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Claude request failed.", raw: data },
        { status: response.status }
      );
    }

    const text =
      data?.content?.map((block) => block?.text || "").join("\n") || "";

    return NextResponse.json({ text, raw: data });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected Claude proxy error." },
      { status: 500 }
    );
  }
}
