import { NextResponse } from "next/server";

const requiredFields = ["name", "country", "email", "message"];

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const missing = requiredFields.filter((field) => !String(body[field] ?? "").trim());

  if (missing.length) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
  }

  console.info("JIESTAR inquiry received", {
    type: body.type,
    email: body.email,
    company: body.company,
    cooperationType: body.cooperationType,
  });

  return NextResponse.json({ ok: true });
}
