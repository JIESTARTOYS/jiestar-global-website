import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/data";
import { createRateLimiter, getRequestIp } from "@/lib/rate-limit";
import { normalizeInquiryPayload } from "@/lib/request-validation";

const inquiryLimiter = createRateLimiter({
  limit: 8,
  windowMs: 60_000,
});

export async function POST(request: Request) {
  const rateLimit = inquiryLimiter.check(getRequestIp(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const normalized = normalizeInquiryPayload(body);

  if (!normalized.ok) {
    return NextResponse.json(
      { error: normalized.error, missingFields: normalized.missingFields },
      { status: 400 },
    );
  }

  console.info("JIESTAR inquiry received", normalized.payload);

  return NextResponse.json({
    ok: true,
    deliveryConfigured: false,
    contactEmail:
      normalized.payload.type === "replacement-parts" ? siteConfig.supportEmail : siteConfig.businessEmail,
  });
}
