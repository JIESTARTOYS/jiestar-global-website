import { NextResponse } from "next/server";
import { createInquiryDeliveryLog, deliverInquiry } from "@/lib/inquiry-delivery";
import { createInquiryDeliveryFailureResponse } from "@/lib/inquiry-api-response";
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

  const requestId = crypto.randomUUID();
  const deliveryStartedAt = Date.now();
  const delivery = await deliverInquiry(normalized.payload);
  const deliveryLog = createInquiryDeliveryLog(normalized.payload, delivery, {
    requestId,
    durationMs: Date.now() - deliveryStartedAt,
  });

  if (deliveryLog.level === "error") {
    console.error(JSON.stringify(deliveryLog));
  } else {
    console.info(JSON.stringify(deliveryLog));
  }

  if (!delivery.ok) {
    return NextResponse.json(
      createInquiryDeliveryFailureResponse(delivery),
      { status: delivery.deliveryConfigured ? 502 : 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    deliveryConfigured: delivery.deliveryConfigured,
    contactEmail: delivery.contactEmail,
  });
}
