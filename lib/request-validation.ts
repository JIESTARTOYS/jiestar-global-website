export type InquiryType = "wholesale" | "custom" | "contact" | "replacement-parts";

export type NormalizedInquiryPayload = {
  type: InquiryType;
} & Record<string, string>;

type NormalizeResult =
  | {
      ok: true;
      payload: NormalizedInquiryPayload;
    }
  | {
      ok: false;
      error: string;
      missingFields?: string[];
    };

const allowedInquiryTypes = new Set<InquiryType>(["wholesale", "custom", "contact", "replacement-parts"]);
const allowedFields = [
  "type",
  "name",
  "company",
  "country",
  "email",
  "whatsapp",
  "businessType",
  "interestedCategory",
  "cooperationType",
  "customizationNeeds",
  "estimatedQuantity",
  "targetMarket",
  "targetSalesChannel",
  "message",
  "orderNumber",
  "purchaseChannel",
  "productName",
  "productSku",
  "issueType",
  "preferredContact",
];
const fieldLimits: Record<string, number> = {
  message: 5000,
  customizationNeeds: 3000,
  interestedCategory: 500,
  company: 200,
  email: 254,
  name: 160,
  whatsapp: 120,
};
const defaultFieldLimit = 300;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredFieldsForType(type: InquiryType) {
  return type === "wholesale" ? ["email"] : ["name", "country", "email", "message"];
}

function hasValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeInquiryPayload(body: Record<string, unknown>): NormalizeResult {
  const type = readString(body.type) || "contact";

  if (!allowedInquiryTypes.has(type as InquiryType)) {
    return { ok: false, error: "Invalid inquiry type." };
  }

  const inquiryType = type as InquiryType;
  const payload: NormalizedInquiryPayload = { type: inquiryType };

  for (const field of allowedFields) {
    if (field === "type") {
      continue;
    }

    const value = readString(body[field]);

    if (!value) {
      continue;
    }

    const limit = fieldLimits[field] ?? defaultFieldLimit;

    if (value.length > limit) {
      return { ok: false, error: `Field ${field} is too long.` };
    }

    payload[field] = value;
  }

  const missingFields = requiredFieldsForType(inquiryType).filter((field) => !payload[field]);

  if (missingFields.length) {
    return {
      ok: false,
      error: `Missing fields: ${missingFields.join(", ")}`,
      missingFields,
    };
  }

  if (!hasValidEmail(payload.email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  return { ok: true, payload };
}
