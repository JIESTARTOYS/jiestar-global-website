import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInquiryEmail,
  createInquiryDeliveryLog,
  deliverInquiry,
  getInquiryDeliveryConfig,
  getInquiryRecipient,
  type InquiryDeliveryConfig,
} from "./inquiry-delivery.ts";
import type { NormalizedInquiryPayload } from "./request-validation.ts";

const wholesalePayload: NormalizedInquiryPayload = {
  type: "wholesale",
  locale: "es",
  sourcePath: "/es/wholesale",
  productHandle: "city-train-59005",
  email: "buyer@example.com",
  company: "Global Blocks Ltd",
  country: "United States",
  interestedCategory: "Trains",
  message: "Please send wholesale information.",
};

function createConfig(overrides: Partial<InquiryDeliveryConfig> = {}): InquiryDeliveryConfig {
  return {
    resendApiKey: "test_resend_key",
    fromEmail: "JIESTAR Website <inquiries@jiestartoys.com>",
    businessEmail: "info@jiestartoys.com",
    supportEmail: "support@jiestartoys.com",
    ...overrides,
  };
}

test("getInquiryRecipient routes business inquiries to contact email and replacement requests to support", () => {
  assert.equal(getInquiryRecipient({ ...wholesalePayload, type: "wholesale" }, createConfig()), "info@jiestartoys.com");
  assert.equal(getInquiryRecipient({ ...wholesalePayload, type: "custom" }, createConfig()), "info@jiestartoys.com");
  assert.equal(getInquiryRecipient({ ...wholesalePayload, type: "contact" }, createConfig()), "info@jiestartoys.com");
  assert.equal(
    getInquiryRecipient({ ...wholesalePayload, type: "replacement-parts" }, createConfig()),
    "support@jiestartoys.com",
  );
});

test("buildInquiryEmail formats a readable internal notification", () => {
  const email = buildInquiryEmail(wholesalePayload, createConfig());

  assert.equal(email.to, "info@jiestartoys.com");
  assert.equal(email.from, "JIESTAR Website <inquiries@jiestartoys.com>");
  assert.equal(email.reply_to, "buyer@example.com");
  assert.match(email.subject, /Wholesale inquiry/i);
  assert.match(email.text, /Global Blocks Ltd/);
  assert.match(email.text, /Interested Category: Trains/);
  assert.match(email.text, /Language \/ Locale: es/);
  assert.match(email.text, /Source Page: \/es\/wholesale/);
  assert.match(email.text, /Product Handle: city-train-59005/);
  assert.match(email.html, /Please send wholesale information\./);
});

test("deliverInquiry fails safely when Resend is not configured without calling fetch", async () => {
  let called = false;
  const result = await deliverInquiry(wholesalePayload, createConfig({ resendApiKey: "" }), async () => {
    called = true;
    return new Response(null, { status: 200 });
  });

  assert.equal(result.ok, false);
  assert.equal(result.deliveryConfigured, false);
  assert.equal(result.contactEmail, "info@jiestartoys.com");
  assert.equal(result.logError, "delivery_not_configured");
  assert.equal(called, false);
});

test("deliverInquiry sends email through Resend when configured", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const result = await deliverInquiry(wholesalePayload, createConfig(), async (url, init) => {
    requests.push({ url: String(url), init });
    return Response.json({ id: "email_123" }, { status: 200 });
  });

  assert.equal(result.ok, true);
  assert.equal(result.deliveryConfigured, true);
  assert.equal(result.contactEmail, "info@jiestartoys.com");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.resend.com/emails");
  assert.equal((requests[0].init?.headers as Record<string, string>).Authorization, "Bearer test_resend_key");
});

test("deliverInquiry returns a readable error when Resend fails", async () => {
  const result = await deliverInquiry(wholesalePayload, createConfig(), async () =>
    Response.json({ message: "Domain is not verified" }, { status: 403 }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.deliveryConfigured, true);
  assert.equal(result.contactEmail, "info@jiestartoys.com");
  assert.equal(result.error, "Email delivery failed: Domain is not verified");
});

test("deliverInquiry returns a readable error when Resend request times out", async () => {
  const result = await deliverInquiry(
    wholesalePayload,
    createConfig({ timeoutMs: 1 }),
    async (_url, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted", "AbortError"));
        });
      }),
  );

  assert.equal(result.ok, false);
  assert.equal(result.deliveryConfigured, true);
  assert.equal(result.contactEmail, "info@jiestartoys.com");
  assert.equal(result.error, "Email delivery failed: Resend request timed out");
});

test("getInquiryDeliveryConfig falls back when optional email environment variables are empty", () => {
  const previousContactEmail = process.env.CONTACT_EMAIL;
  const previousSupportEmail = process.env.SUPPORT_EMAIL;
  const previousFromEmail = process.env.INQUIRY_FROM_EMAIL;

  process.env.CONTACT_EMAIL = "";
  process.env.SUPPORT_EMAIL = "";
  process.env.INQUIRY_FROM_EMAIL = "";

  try {
    const config = getInquiryDeliveryConfig();

    assert.equal(config.businessEmail, "info@jiestartoys.com");
    assert.equal(config.supportEmail, "support@jiestartoys.com");
    assert.equal(config.fromEmail, undefined);
  } finally {
    process.env.CONTACT_EMAIL = previousContactEmail;
    process.env.SUPPORT_EMAIL = previousSupportEmail;
    process.env.INQUIRY_FROM_EMAIL = previousFromEmail;
  }
});

test("createInquiryDeliveryLog contains operational fields but excludes inquiry content and attribution", () => {
  const log = createInquiryDeliveryLog(
    {
      ...wholesalePayload,
      name: "Sensitive Buyer",
      whatsapp: "+1 555 0100",
      orderNumber: "ORDER-SECRET",
    },
    {
      ok: true,
      deliveryConfigured: true,
      contactEmail: "info@jiestartoys.com",
    },
    { requestId: "request-123", durationMs: 12.6 },
  );

  assert.deepEqual(log, {
    level: "info",
    message: "Inquiry delivery completed",
    route: "/api/inquiry",
    requestId: "request-123",
    inquiryType: "wholesale",
    locale: "es",
    deliveryConfigured: true,
    durationMs: 13,
    outcome: "delivered",
  });

  const serialized = JSON.stringify(log);
  assert.doesNotMatch(serialized, /Sensitive Buyer/);
  assert.doesNotMatch(serialized, /es\/wholesale/);
  assert.doesNotMatch(serialized, /city-train-59005/);
  assert.doesNotMatch(serialized, /buyer@example\.com/);
  assert.doesNotMatch(serialized, /555 0100/);
  assert.doesNotMatch(serialized, /ORDER-SECRET/);
  assert.doesNotMatch(serialized, /Please send wholesale information/);
});

test("createInquiryDeliveryLog uses a sanitized delivery error", async () => {
  const delivery = await deliverInquiry(wholesalePayload, createConfig(), async () => {
    throw new Error("buyer@example.com failed with secret-token");
  });

  assert.equal(delivery.ok, false);

  const log = createInquiryDeliveryLog(wholesalePayload, delivery, {
    requestId: "request-456",
    durationMs: 4,
  });
  const serialized = JSON.stringify(log);

  assert.equal(log.level, "error");
  assert.equal(log.error, "resend_request_failed");
  assert.doesNotMatch(serialized, /buyer@example\.com/);
  assert.doesNotMatch(serialized, /secret-token/);
});

test("createInquiryDeliveryLog treats missing delivery configuration as an operational error", async () => {
  const delivery = await deliverInquiry(
    wholesalePayload,
    createConfig({ resendApiKey: "" }),
  );
  const log = createInquiryDeliveryLog(wholesalePayload, delivery, {
    requestId: "request-789",
    durationMs: 2,
  });

  assert.deepEqual(log, {
    level: "error",
    message: "Inquiry delivery failed",
    route: "/api/inquiry",
    requestId: "request-789",
    inquiryType: "wholesale",
    locale: "es",
    deliveryConfigured: false,
    durationMs: 2,
    outcome: "failed",
    error: "delivery_not_configured",
  });
});
